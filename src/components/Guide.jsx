import React from 'react';
import { HelpCircle, ArrowRight, Settings, Shield, FileText, Download, Mail, Smartphone } from 'lucide-react';

const Guide = () => {
  const steps = [
    {
      icon: <Smartphone size={24} className="guide-step-icon" />,
      title: "Open Instagram",
      desc: "First of all, you have to open your Instagram app on a mobile device or on a web browser."
    },
    {
      icon: <Settings size={24} className="guide-step-icon" />,
      title: "Settings & Accounts Center",
      desc: "After that, you need to go to Settings & there open the Accounts Center."
    },
    {
      icon: <Shield size={24} className="guide-step-icon" />,
      title: "Your Information & Permissions",
      desc: "Then, you must click on “Your Information and Permissions.”"
    },
    {
      icon: <FileText size={24} className="guide-step-icon" />,
      title: "Export Your Information",
      desc: "Next, you should tap on “Export your information.”"
    },
    {
      icon: <Download size={24} className="guide-step-icon" />,
      title: "Create Export",
      desc: "Now, you have to tap on “Create Export” to initiate the procedure."
    },
    {
      icon: <Smartphone size={24} className="guide-step-icon" />,
      title: "Export to Device",
      desc: "Further, you can select the option of “Export to Device.”"
    },
    {
      icon: <FileText size={24} className="guide-step-icon" />,
      title: "Select Messages & JSON",
      desc: "In the customized information, you have to select only messages & file format JSON & then save it."
    },
    {
      icon: <ArrowRight size={24} className="guide-step-icon" />,
      title: "Start Export",
      desc: "After this, you must click on the “Start Export”. This will ask for your password to confirm."
    },
    {
      icon: <Mail size={24} className="guide-step-icon" />,
      title: "Wait for Email",
      desc: "Instagram will send a download link to your email after processing."
    },
    {
      icon: <Download size={24} className="guide-step-icon" />,
      title: "Download & View",
      desc: "Once downloaded, unzip the file and upload the messages folder/files to ChatLens to analyze!"
    }
  ];

  return (
    <div className="guide-page fade-in">
      <div className="guide-header">
        <HelpCircle size={48} className="guide-main-icon" />
        <h1 className="guide-title gradient-text">How to Export Your Chat</h1>
        <p className="guide-subtitle">Follow these steps to securely download your Instagram history for local analysis.</p>
      </div>

      <div className="guide-steps">
        {steps.map((step, idx) => (
          <div key={idx} className="guide-step-card glass-card">
            <div className="guide-step-number">{idx + 1}</div>
            <div className="guide-step-content">
              <div className="guide-step-header">
                {step.icon}
                <h3>{step.title}</h3>
              </div>
              <p>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="guide-footer-note glass-panel">
        <Shield size={20} className="info-icon" />
        <p><strong>Privacy Note:</strong> Your data never leaves your computer. ChatLens processes your export files entirely in your browser memory.</p>
      </div>
    </div>
  );
};

export default Guide;
