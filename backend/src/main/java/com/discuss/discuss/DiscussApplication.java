package com.discuss.discuss;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class DiscussApplication {

	public static void main(String[] args) {
		SpringApplication.run(DiscussApplication.class, args);
	}

}
