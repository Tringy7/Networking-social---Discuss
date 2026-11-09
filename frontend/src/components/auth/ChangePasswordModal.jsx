import { useAuth } from '../../context/AuthContext';
import ChangePasswordDialog from './ChangePasswordDialog';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  return isOpen ? <ChangePasswordDialog email={currentUser?.email} onClose={onClose} /> : null;
}
