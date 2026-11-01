package com.discuss.discuss.service.media;

import com.discuss.discuss.enums.ImageKind;
import com.discuss.discuss.exception.media.MediaErrorCode;
import com.discuss.discuss.exception.media.MediaException;
import com.luciad.imageio.webp.WebPWriteParam;
import net.coobird.thumbnailator.Thumbnails;
import net.coobird.thumbnailator.geometry.Positions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import java.util.concurrent.Semaphore;

/**
 * Validates, resizes/crops and re-encodes uploaded images while preserving
 * the original format (JPEG -> JPEG, PNG -> PNG, WebP -> WebP).
 *
 * Three different outcomes are possible, with different quality implications:
 *  1. PASS-THROUGH: no resize needed (and no EXIF rotation) -> original bytes returned untouched.
 *  2. RESIZE + RE-ENCODE: image is decoded, resized/cropped, encoded in the SAME format.
 *     JPEG/WebP are lossy, so quality is slightly reduced; PNG stays lossless.
 *  3. Rejection: invalid, unsupported, animated or too-large images -> MediaException.
 */
@Service
public class ImageProcessingService {

    /** Supported formats. The content type always describes the actual output bytes. */
    private enum Format {
        JPEG("image/jpeg"), PNG("image/png"), WEBP("image/webp");

        final String contentType;

        Format(String contentType) {
            this.contentType = contentType;
        }

        /** Maps the ImageIO reader format name to a supported format, or null if unsupported. */
        static Format fromReaderName(String name) {
            return switch (name.toLowerCase()) {
                case "jpeg", "jpg" -> JPEG;
                case "png" -> PNG;
                case "webp" -> WEBP;
                default -> null;
            };
        }
    }

    private record Header(Format format, int width, int height) {
    }

    /** Result of processing: output bytes, output dimensions and the real content type. */
    public record Processed(byte[] data, int width, int height, String contentType) {
    }

    private final long maxBytes;
    private final long maxPixels;
    private final float jpegQuality;
    private final float webpQuality;
    private final Semaphore concurrency;

    public ImageProcessingService(
            @Value("${media.image.max-bytes:10485760}") long maxBytes,
            @Value("${media.image.max-pixels:40000000}") long maxPixels,
            @Value("${media.image.jpeg-quality:0.85}") float jpegQuality,
            @Value("${media.image.webp-quality:0.8}") float webpQuality,
            @Value("${media.image.max-concurrent-processing:2}") int maxConcurrent) {

        requireQuality("media.image.jpeg-quality", jpegQuality);
        requireQuality("media.image.webp-quality", webpQuality);

        this.maxBytes = maxBytes;
        this.maxPixels = maxPixels;
        this.jpegQuality = jpegQuality;
        this.webpQuality = webpQuality;
        this.concurrency = new Semaphore(Math.max(1, maxConcurrent));
    }

    private static void requireQuality(String name, float q) {
        if (!(q > 0f && q <= 1f)) {
            throw new IllegalArgumentException(name + " must be in the range (0, 1], got " + q);
        }
    }

    // ------------------------------------------------------------------ main flow

    public Processed process(MultipartFile file, ImageKind kind) {
        if (file == null || file.isEmpty()) {
            throw new MediaException(MediaErrorCode.EMPTY_FILE);
        }
        if (file.getSize() > maxBytes) {
            throw new MediaException(MediaErrorCode.FILE_TOO_LARGE);
        }

        byte[] bytes = readBytes(file);
        Header header = inspect(bytes); // format + dimensions checked WITHOUT decoding pixels

        int orientation = header.format() == Format.JPEG ? jpegExifOrientation(bytes) : 1;

        // 1) Pass-through: nothing to change, keep original bytes (no quality loss).
        if (orientation == 1 && fitsWithoutChange(header, kind)) {
            return new Processed(bytes, header.width(), header.height(), header.format().contentType);
        }

        // 2) Decode -> resize -> encode in the same format.
        concurrency.acquireUninterruptibly();
        try {
            BufferedImage src = decode(bytes);
            BufferedImage out = resize(src, kind);
            return new Processed(
                    encode(out, header.format()),
                    out.getWidth(),
                    out.getHeight(),
                    header.format().contentType);

        } catch (MediaException e) {
            throw e; // keep the original error code
        } catch (IOException | RuntimeException e) {
            throw new MediaException(
                    MediaErrorCode.IMAGE_PROCESSING_FAILED, "Failed to process image", e);
        } finally {
            concurrency.release();
        }
    }

    // ------------------------------------------------------------------ validation

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new MediaException(MediaErrorCode.INVALID_IMAGE, "Failed to read upload", e);
        }
    }

    /**
     * Detects the REAL format from the bytes (filename and Content-Type are ignored),
     * rejects unsupported/animated images and enforces the pixel limit from the header only.
     */
    private Header inspect(byte[] bytes) {
        try (ImageInputStream iis = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            Iterator<ImageReader> readers = iis == null ? null : ImageIO.getImageReaders(iis);
            if (readers == null || !readers.hasNext()) {
                throw new MediaException(MediaErrorCode.INVALID_IMAGE);
            }

            ImageReader reader = readers.next();
            try {
                Format format = Format.fromReaderName(reader.getFormatName());
                if (format == null || isAnimated(bytes, format)) {
                    throw new MediaException(MediaErrorCode.UNSUPPORTED_IMAGE_FORMAT);
                }

                reader.setInput(iis, true, true);
                int w = reader.getWidth(0);
                int h = reader.getHeight(0);

                if ((long) w * h > maxPixels) {
                    throw new MediaException(MediaErrorCode.IMAGE_RESOLUTION_TOO_LARGE);
                }
                return new Header(format, w, h);

            } finally {
                reader.dispose();
            }
        } catch (MediaException e) {
            throw e;
        } catch (IOException | RuntimeException e) {
            throw new MediaException(
                    MediaErrorCode.INVALID_IMAGE, "Failed to read image header", e);
        }
    }

    // ------------------------------------------------------------------ decode / resize

    /**
     * Thumbnailator applies EXIF orientation when the source is a File/InputStream
     * (needs Thumbnailator >= 0.4.8 - verify in pom.xml).
     */
    private BufferedImage decode(byte[] bytes) {
        try {
            return Thumbnails.of(new ByteArrayInputStream(bytes))
                    .scale(1.0)
                    .asBufferedImage();
        } catch (IOException | RuntimeException e) {
            throw new MediaException(MediaErrorCode.INVALID_IMAGE, "Failed to decode image", e);
        }
    }

    /** True when the image already satisfies the ImageKind rules (no crop, no downscale). */
    private static boolean fitsWithoutChange(Header h, ImageKind kind) {
        if (kind.isSquare()) {
            return h.width() == h.height() && h.width() <= kind.getMaxWidth();
        }
        return h.width() <= kind.getMaxWidth() && h.height() <= kind.getMaxHeight();
    }

    /** Never enlarges and never distorts. */
    private BufferedImage resize(BufferedImage src, ImageKind kind) throws IOException {
        int w = src.getWidth();
        int h = src.getHeight();

        if (kind.isSquare()) {
            // Center-crop to a square of at most maxWidth; small images are not enlarged.
            int side = Math.min(kind.getMaxWidth(), Math.min(w, h));
            if (w == side && h == side) {
                return src;
            }
            return Thumbnails.of(src).size(side, side).crop(Positions.CENTER).asBufferedImage();
        }

        if (w <= kind.getMaxWidth() && h <= kind.getMaxHeight()) {
            return src;
        }
        return Thumbnails.of(src).size(kind.getMaxWidth(), kind.getMaxHeight()).asBufferedImage();
    }

    // ------------------------------------------------------------------ encode

    private byte[] encode(BufferedImage img, Format format) throws IOException {
        ImageWriter writer = findWriter(format);
        try {
            ImageWriteParam param = buildParam(writer, format);
            BufferedImage toWrite = format == Format.JPEG ? flattenForJpeg(img) : img;

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (ImageOutputStream ios = ImageIO.createImageOutputStream(baos)) {
                writer.setOutput(ios);
                writer.write(null, new IIOImage(toWrite, null, null), param);
            } // closed here -> data flushed before toByteArray()
            return baos.toByteArray();
        } finally {
            writer.dispose();
        }
    }

    private ImageWriter findWriter(Format format) throws IOException {
        Iterator<ImageWriter> it = switch (format) {
            case JPEG -> ImageIO.getImageWritersByFormatName("jpeg");
            case PNG -> ImageIO.getImageWritersByFormatName("png");
            case WEBP -> ImageIO.getImageWritersByMIMEType(Format.WEBP.contentType);
        };
        if (!it.hasNext()) {
            throw new IOException("No ImageIO writer available for " + format
                    + " (for WebP check the webp-imageio dependency and native libraries)");
        }
        return it.next();
    }

    private ImageWriteParam buildParam(ImageWriter writer, Format format) {
        switch (format) {
            case JPEG -> {
                ImageWriteParam p = writer.getDefaultWriteParam();
                p.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                p.setCompressionQuality(jpegQuality);
                return p;
            }
            case WEBP -> {
                WebPWriteParam p = new WebPWriteParam(writer.getLocale());
                p.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                p.setCompressionType(p.getCompressionTypes()[WebPWriteParam.LOSSY_COMPRESSION]);
                p.setCompressionQuality(webpQuality);
                return p;
            }
            default -> {
                // PNG: always lossless. The JDK writer offers no meaningful "optimize" knob,
                // so no fake quality setting is applied.
                return writer.getDefaultWriteParam();
            }
        }
    }

    /** JPEG has no alpha channel; ImageIO's JPEG writer fails on ARGB images. */
    private static BufferedImage flattenForJpeg(BufferedImage img) {
        if (!img.getColorModel().hasAlpha()) {
            return img;
        }
        BufferedImage rgb = new BufferedImage(img.getWidth(), img.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = rgb.createGraphics();
        try {
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, rgb.getWidth(), rgb.getHeight());
            g.drawImage(img, 0, 0, null);
        } finally {
            g.dispose();
        }
        return rgb;
    }

    // ------------------------------------------------------------------ byte-level helpers

    /** Animated WebP / APNG cannot be kept by the BufferedImage pipeline, so they are rejected. */
    private static boolean isAnimated(byte[] d, Format format) {
        return switch (format) {
            case WEBP -> d.length > 20
                    && d[12] == 'V' && d[13] == 'P' && d[14] == '8' && d[15] == 'X'
                    && (d[20] & 0x02) != 0; // VP8X animation flag
            case PNG -> pngHasAnimationChunk(d);
            default -> false;
        };
    }

    private static boolean pngHasAnimationChunk(byte[] d) {
        int pos = 8; // skip PNG signature
        while (pos + 8 <= d.length) {
            long len = u32(d, pos, false);
            String type = new String(d, pos + 4, 4, java.nio.charset.StandardCharsets.ISO_8859_1);
            if (type.equals("acTL")) return true;
            if (type.equals("IDAT")) return false; // acTL must come before IDAT
            long next = pos + 12L + len;
            if (next > d.length) break;
            pos = (int) next;
        }
        return false;
    }

    /** Reads the EXIF orientation (1-8) of a JPEG; returns 1 when absent or unreadable. */
    private static int jpegExifOrientation(byte[] d) {
        if (d.length < 4 || (d[0] & 0xFF) != 0xFF || (d[1] & 0xFF) != 0xD8) return 1;
        int pos = 2;
        while (pos + 4 <= d.length && (d[pos] & 0xFF) == 0xFF) {
            int marker = d[pos + 1] & 0xFF;
            if (marker == 0xD9 || marker == 0xDA) break; // EOI / start of scan
            int len = u16(d, pos + 2, false);
            if (len < 2) break;
            if (marker == 0xE1 && pos + 10 <= d.length
                    && d[pos + 4] == 'E' && d[pos + 5] == 'x' && d[pos + 6] == 'i' && d[pos + 7] == 'f'
                    && d[pos + 8] == 0 && d[pos + 9] == 0) {
                return tiffOrientation(d, pos + 10);
            }
            pos += 2 + len;
        }
        return 1;
    }

    private static int tiffOrientation(byte[] d, int tiff) {
        if (tiff + 8 > d.length) return 1;
        boolean le = d[tiff] == 'I' && d[tiff + 1] == 'I';
        if (!le && !(d[tiff] == 'M' && d[tiff + 1] == 'M')) return 1;

        long ifd = u32(d, tiff + 4, le);
        long start = tiff + ifd;
        if (ifd < 8 || start + 2 > d.length) return 1;

        int count = u16(d, (int) start, le);
        for (int i = 0; i < count; i++) {
            long e = start + 2 + 12L * i;
            if (e + 12 > d.length) break;
            if (u16(d, (int) e, le) == 0x0112) {
                int v = u16(d, (int) e + 8, le);
                return (v >= 1 && v <= 8) ? v : 1;
            }
        }
        return 1;
    }

    private static int u16(byte[] d, int off, boolean le) {
        int a = d[off] & 0xFF, b = d[off + 1] & 0xFF;
        return le ? (b << 8) | a : (a << 8) | b;
    }

    private static long u32(byte[] d, int off, boolean le) {
        long a = u16(d, off, le), b = u16(d, off + 2, le);
        return le ? (b << 16) | a : (a << 16) | b;
    }
}