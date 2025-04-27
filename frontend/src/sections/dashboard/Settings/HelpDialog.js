import React, { useState } from "react";
import {
  Dialog,
  Slide,
  DialogContent,
  DialogTitle,
  Button,
  Stack,
  Typography,
  Divider,
  Box,
  Tabs,
  Tab,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  DialogActions
} from "@mui/material";
import { 
  Info, 
  Question, 
  Lifebuoy, 
  FileText, 
  CaretDown,
  EnvelopeSimple,
  Phone as PhoneIcon,
  ChatCircleDots
} from "phosphor-react";
import { useTheme } from "@mui/material/styles";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const HelpDialog = ({ open, handleClose }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={handleClose}
      aria-describedby="help-dialog"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: theme.palette.mode === 'light' 
            ? '0px 8px 24px rgba(0,0,0,0.12)' 
            : '0px 8px 24px rgba(0,0,0,0.4)',
        }
      }}
    >
      <DialogTitle sx={{ 
        p: 3, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        fontWeight: 600
      }}>
        <Info size={24} weight="fill" />
        {"Help & Support"}
      </DialogTitle>
      
      <Divider sx={{ 
        borderColor: theme.palette.mode === 'light' 
          ? 'rgba(0,0,0,0.08)' 
          : 'rgba(255,255,255,0.08)'
      }} />
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="help tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontWeight: 500
            }
          }}
        >
          <Tab 
            icon={<Question size={20} />} 
            iconPosition="start" 
            label="FAQs" 
            id="tab-0" 
            aria-controls="tabpanel-0" 
          />
          <Tab 
            icon={<Lifebuoy size={20} />} 
            iconPosition="start" 
            label="Contact Support" 
            id="tab-1" 
            aria-controls="tabpanel-1" 
          />
          <Tab 
            icon={<FileText size={20} />} 
            iconPosition="start" 
            label="Policies & Terms" 
            id="tab-2" 
            aria-controls="tabpanel-2" 
          />
        </Tabs>
      </Box>
      
      <DialogContent sx={{ p: 3 }}>
        <TabPanel value={activeTab} index={0}>
          <FaqsContent />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <ContactSupportContent />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <PoliciesContent />
        </TabPanel>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3, pt: 1, justifyContent: 'center' }}>
        <Button 
          variant="contained" 
          onClick={handleClose}
          sx={{
            borderRadius: 1.5,
            px: 3,
            boxShadow: '0px 2px 6px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0px 4px 12px rgba(0,0,0,0.2)',
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const FaqsContent = () => {
  return (
    <Stack spacing={2}>
      <Typography variant="h6" sx={{ mb: 1 }}>Frequently Asked Questions</Typography>
      
      <FaqAccordion 
        question="How do I add a new contact?" 
        answer="To add a new contact, click on the Contacts tab, then click the '+' button. Enter the user's email or username and send them a connection request."
      />
      
      <FaqAccordion 
        question="How do I create a group chat?" 
        answer="To create a group, navigate to the Groups tab and click 'Create Group'. Add a group name, optional description, and select contacts to add to your group."
      />
      
      <FaqAccordion 
        question="Can I delete messages after sending them?" 
        answer="Yes, you can delete messages you've sent. Hover over the message, click the three dots menu, and select 'Delete'. Note that deleted messages may still be visible to recipients who saw them before deletion."
      />
      
      <FaqAccordion 
        question="How do I change my profile picture?" 
        answer="Go to Settings, then click on your profile section at the top. You can upload or change your profile picture from the profile editor."
      />
      
      <FaqAccordion 
        question="Is my chat data encrypted?" 
        answer="Yes, all messages are encrypted during transmission. We use industry-standard encryption protocols to ensure your conversations remain private and secure."
      />
      
      <FaqAccordion 
        question="How do I switch between dark and light mode?" 
        answer="Go to Settings, click on 'Theme', and choose between Light Mode, Dark Mode, or System Default (which follows your device settings)."
      />
    </Stack>
  );
};

const ContactSupportContent = () => {
  return (
    <Stack spacing={4}>
      <Typography variant="h6" sx={{ mb: 1 }}>Contact Support</Typography>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 3,
        justifyContent: 'space-between'
      }}>
        <ContactMethod 
          icon={<EnvelopeSimple size={24} />}
          title="Email Support"
          description="Send us an email for general inquiries or non-urgent issues."
          contact="support@chatapp.com"
          isEmail
        />
        
        <ContactMethod 
          icon={<PhoneIcon size={24} />}
          title="Phone Support"
          description="Call us during business hours for immediate assistance."
          contact="+1 (555) 123-4567"
          isPhone
        />
        
        <ContactMethod 
          icon={<ChatCircleDots size={24} />}
          title="Live Chat"
          description="Chat with our support team in real-time."
          contact="Start Chat"
          isButton
        />
      </Box>
    </Stack>
  );
};

const PoliciesContent = () => {
  return (
    <Stack spacing={3}>
      <Typography variant="h6" sx={{ mb: 1 }}>Policies & Terms</Typography>
      
      <Stack spacing={1}>
        <Typography variant="subtitle1" fontWeight={600}>Privacy Policy</Typography>
        <Typography variant="body2" paragraph>
          Our Privacy Policy describes how we collect, use, and protect your personal information. 
          We are committed to protecting your privacy and ensuring the security of your data.
        </Typography>
        <Link 
          href="#" 
          underline="hover"
          sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 0.5,
            fontWeight: 500,
            color: 'primary.main',
            '&:hover': { color: 'primary.dark' }
          }}
        >
          Read full Privacy Policy
        </Link>
      </Stack>
      
      <Divider />
      
      <Stack spacing={1}>
        <Typography variant="subtitle1" fontWeight={600}>Terms of Service</Typography>
        <Typography variant="body2" paragraph>
          Our Terms of Service outline the rules and guidelines for using our platform.
          By using our services, you agree to comply with these terms and conditions.
        </Typography>
        <Link 
          href="#" 
          underline="hover"
          sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 0.5,
            fontWeight: 500,
            color: 'primary.main',
            '&:hover': { color: 'primary.dark' }
          }}
        >
          Read full Terms of Service
        </Link>
      </Stack>
      
      <Divider />
      
      <Stack spacing={1}>
        <Typography variant="subtitle1" fontWeight={600}>Data Retention Policy</Typography>
        <Typography variant="body2" paragraph>
          Our Data Retention Policy explains how long we keep your data and when it is deleted.
          We only retain your data for as long as necessary to provide our services and comply with legal obligations.
        </Typography>
        <Link 
          href="#" 
          underline="hover"
          sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 0.5,
            fontWeight: 500,
            color: 'primary.main',
            '&:hover': { color: 'primary.dark' }
          }}
        >
          Read full Data Retention Policy
        </Link>
      </Stack>
      
      <Divider />
      
      <Stack spacing={1}>
        <Typography variant="subtitle1" fontWeight={600}>Cookie Policy</Typography>
        <Typography variant="body2" paragraph>
          Our Cookie Policy explains how we use cookies and similar technologies.
          Cookies help us improve your experience and understand how our services are being used.
        </Typography>
        <Link 
          href="#" 
          underline="hover"
          sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 0.5,
            fontWeight: 500,
            color: 'primary.main',
            '&:hover': { color: 'primary.dark' }
          }}
        >
          Read full Cookie Policy
        </Link>
      </Stack>
    </Stack>
  );
};

// Helper components
const FaqAccordion = ({ question, answer }) => {
  const theme = useTheme();
  
  return (
    <Accordion 
      disableGutters 
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 1,
        '&:before': { display: 'none' },
        backgroundColor: 'transparent',
        mb: 1
      }}
    >
      <AccordionSummary
        expandIcon={<CaretDown />}
        sx={{
          px: 2,
          '&.Mui-expanded': {
            minHeight: 48,
            borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`
          },
        }}
      >
        <Typography variant="subtitle2">{question}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 2 }}>
        <Typography variant="body2">{answer}</Typography>
      </AccordionDetails>
    </Accordion>
  );
};

const ContactMethod = ({ icon, title, description, contact, isEmail, isPhone, isButton }) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        p: 2,
        border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        flex: 1,
        minWidth: { xs: '100%', md: '30%' },
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
          borderColor: theme.palette.primary.main,
        }
      }}
    >
      <Box 
        sx={{ 
          color: 'primary.main', 
          mb: 1.5,
          p: 1,
          borderRadius: '50%',
          backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
        }}
      >
        {icon}
      </Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
      
      {isEmail && (
        <Link 
          href={`mailto:${contact}`} 
          color="primary"
          sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          {contact}
        </Link>
      )}
      
      {isPhone && (
        <Link 
          href={`tel:${contact.replace(/\D/g, '')}`} 
          color="primary"
          sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          {contact}
        </Link>
      )}
      
      {isButton && (
        <Button 
          variant="outlined" 
          color="primary"
          sx={{ borderRadius: 1.5, px: 2 }}
        >
          {contact}
        </Button>
      )}
    </Box>
  );
};

export default HelpDialog; 