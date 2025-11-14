import { Button } from '@mui/material';
import { useUserContext } from '../context/UserContext';

const TestXPButton = () => {
  const { token } = useUserContext();

  const handleTest = async () => {
    try {
      console.log('🧪 Sending test XP notification request...');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/gamification/test-xp-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('🧪 Test response:', data);
    } catch (error) {
      console.error('🧪 Test error:', error);
    }
  };

  return (
    <Button 
      variant="contained" 
      color="secondary" 
      onClick={handleTest}
      sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}
    >
      Test XP Toast
    </Button>
  );
};

export default TestXPButton;
