import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, File as FileIcon, AlertCircle, BarChart2, MessageSquare, Shield } from 'lucide-react';

const FileImport = ({ onDataParsed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [filesList, setFilesList] = useState([]);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const folderInputRef = useRef(null);

  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute("webkitdirectory", "true");
      folderInputRef.current.setAttribute("directory", "true");
    }
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFiles = async (files) => {
    setError(null);
    const validFiles = Array.from(files).filter(f => f.name.endsWith('.json') || f.name.endsWith('.html'));
    
    if (validFiles.length === 0) {
      setError("No valid JSON or HTML files found. Please upload Instagram DM exports.");
      return;
    }

    setFilesList(prev => {
      const newList = [...prev];
      validFiles.forEach(vf => {
        if (!newList.some(pf => pf.name === vf.name && pf.size === vf.size)) {
          newList.push(vf);
        }
      });
      return newList;
    });
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.items) {
      let files = [];
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i].webkitGetAsEntry();
        if (item) {
          files = files.concat(await scanFiles(item));
        }
      }
      if (files.length > 0) {
         processFiles(files);
      } else {
         processFiles(e.dataTransfer.files);
      }
    } else {
      processFiles(e.dataTransfer.files);
    }
  };

  const scanFiles = async (item) => {
    let result = [];
    if (item.isFile) {
      const file = await new Promise(resolve => item.file(resolve));
      result.push(file);
    } else if (item.isDirectory) {
      const dirReader = item.createReader();
      const entries = await new Promise(resolve => dirReader.readEntries(resolve));
      for (const entry of entries) {
        result = result.concat(await scanFiles(entry));
      }
    }
    return result;
  };

  const handleFileInput = (e) => {
    processFiles(e.target.files);
  };

  const removeFile = (idx) => {
    setFilesList(filesList.filter((_, i) => i !== idx));
  };

  const handleAnalyze = async () => {
    if (filesList.length === 0) return;
    setIsProcessing(true);
    try {
      const { parseInstagramZip } = await import('../utils/parser.js');
      const chatData = await parseInstagramZip(filesList);
      
      if (chatData.messages.length === 0) {
        setError("No messages found in the provided files.");
        setIsProcessing(false);
        return;
      }
      
      onDataParsed(chatData);
    } catch (err) {
      console.error(err);
      setError("An error occurred while parsing the files.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="glass-panel file-import-card fade-in container-center">
      <div className="import-header">
        <div className="main-logo-icon">
          <MessageSquare size={40} />
        </div>
        <h1 className="main-title">
          <span className="gradient-text">ChatLens</span>
        </h1>
        <p className="main-subtitle">
          Your Personal Instagram DM Analyzer
        </p>

        <div className="landing-features">
          <div className="feature-item">
            <BarChart2 className="feature-icon" />
            <div>
              <h4>Deep Analytics</h4>
              <p>Discover top communicators, most active hours, and top emoji trends.</p>
            </div>
          </div>
          <div className="feature-item">
            <MessageSquare className="feature-icon" />
            <div>
              <h4>Smart Viewer</h4>
              <p>Search, filter, and seamlessly jump chronologically through your chat history.</p>
            </div>
          </div>
          <div className="feature-item">
            <Shield className="feature-icon" />
            <div>
              <h4>100% Private</h4>
              <p>Zero servers involved. All parsing happens completely safely inside your local browser.</p>
            </div>
          </div>
        </div>
      </div>

      <div 
        className={`drop-zone glass-card ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileUpload').click()}
      >
        <Upload size={48} className="drop-icon" />
        <h3 className="drop-title">Drag & Drop files or folders here</h3>
        <p className="drop-subtitle">Supports .json and .html Instagram export files</p>
        <button className="btn-primary">Browse Files</button>
        <input 
          id="fileUpload" 
          type="file" 
          multiple 
          accept=".json,.html"
          onChange={handleFileInput} 
          className="hidden-input" 
        />
        <input 
          id="folderUpload" 
          type="file" 
          ref={folderInputRef}
          multiple 
          onChange={handleFileInput} 
          className="hidden-input" 
        />
        <button 
          className="btn-secondary folder-btn"
          onClick={(e) => { e.stopPropagation(); document.getElementById('folderUpload').click() }}
        >
           Or Select Folder
        </button>
      </div>

      {error && (
        <div className="error-alert">
          <AlertCircle className="error-icon" size={20} />
          <p className="error-text">{error}</p>
        </div>
      )}

      {filesList.length > 0 && (
        <div className="file-list-container">
          <h4 className="file-list-title">Selected Files ({filesList.length})</h4>
          <div className="file-list">
            {filesList.map((file, idx) => (
              <div key={idx} className="file-item glass-card">
                <div className="file-item-info">
                  <FileIcon className="file-item-icon" size={20} />
                  <span className="file-name">{file.webkitRelativePath || file.name}</span>
                  <span className="file-size">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button onClick={() => removeFile(idx)} className="file-remove-btn">
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
          
          <button 
            className="btn-primary analyze-btn"
            onClick={handleAnalyze}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span className="processing-status">
                <span className="spinner"></span>
                Processing...
              </span>
            ) : "Analyze Chat"}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileImport;
