import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// ----------------------------------------------------------------------
// Constants and Configuration
// ----------------------------------------------------------------------

const CONFIG = {
  ADMIN_PASSWORD: 'project',
  API_DELAY: {
    FETCH: 600,
    SAVE: 800,
    DELETE: 500,
    CONTACT: 700
  },
  VALIDATION: {
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
  }
};

const COLOR_MAP = {
  indigo: {
    bg: 'bg-indigo-600 hover:bg-indigo-700',
    focus: 'focus:ring-indigo-500',
    disabled: 'disabled:bg-indigo-400',
  },
  blue: {
    bg: 'bg-blue-600 hover:bg-blue-700',
    focus: 'focus:ring-blue-500',
    disabled: 'disabled:bg-blue-400',
  },
  red: {
    bg: 'bg-red-600 hover:bg-red-700',
    focus: 'focus:ring-red-500',
    disabled: 'disabled:bg-red-400',
  },
  gray: {
    bg: 'bg-gray-400 hover:bg-gray-500',
    focus: 'focus:ring-gray-300',
    disabled: 'disabled:bg-gray-300',
  },
  green: {
    bg: 'bg-green-600 hover:bg-green-700',
    focus: 'focus:ring-green-500',
    disabled: 'disabled:bg-green-400',
  },
  purple: {
    bg: 'bg-purple-600 hover:bg-purple-700',
    focus: 'focus:ring-purple-500',
    disabled: 'disabled:bg-purple-400',
  },
  yellow: {
    bg: 'bg-yellow-500 hover:bg-yellow-600',
    focus: 'focus:ring-yellow-500',
    disabled: 'disabled:bg-yellow-400',
  },
  white: {
    bg: 'bg-white hover:bg-gray-100 text-gray-900',
    focus: 'focus:ring-gray-500',
    disabled: 'disabled:bg-gray-300',
  }
};

const INITIAL_PROJECTS = [
  { 
    _id: 'p1', 
    title: 'MERN Stack E-Commerce', 
    description: 'A full-featured shopping platform with user authentication and payment integration.', 
    technologies: ['MongoDB', 'Express', 'React', 'Node.js', 'Stripe'], 
    liveUrl: 'https://example-ecommerce.com', 
    githubUrl: 'https://github.com/example/ecommerce', 
    isContact: false,
    createdAt: new Date('2024-01-15').toISOString()
  },
  { 
    _id: 'p2', 
    title: 'Real-Time Chat App', 
    description: 'Built with Socket.io for instant messaging, demonstrating excellent WebSocket handling.', 
    technologies: ['Node.js', 'Socket.io', 'React', 'Tailwind'], 
    liveUrl: 'https://example-chat.com', 
    githubUrl: 'https://github.com/example/chat-app', 
    isContact: false,
    createdAt: new Date('2024-02-20').toISOString()
  },
  { 
    _id: 'p3', 
    title: 'Data Visualization Dashboard', 
    description: 'Interactive dashboard using D3.js and TypeScript to display complex data sets.', 
    technologies: ['TypeScript', 'D3.js', 'React'], 
    liveUrl: 'https://example-dashboard.com', 
    githubUrl: 'https://github.com/example/dashboard', 
    isContact: false,
    createdAt: new Date('2024-03-10').toISOString()
  },
];

// ----------------------------------------------------------------------
// Utility Functions
// ----------------------------------------------------------------------

const validateImageFile = (file) => {
  if (!CONFIG.VALIDATION.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Please select a valid image file (JPEG, PNG, GIF)');
  }

  if (file.size > CONFIG.VALIDATION.MAX_IMAGE_SIZE) {
    throw new Error('Please select an image smaller than 5MB');
  }

  return true;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'Unknown date';
  
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// ----------------------------------------------------------------------
// Data Layer (Enhanced Project Service with Contact Management)
// ----------------------------------------------------------------------

class ProjectService {
  constructor() {
    this.projects = this.loadFromStorage();
    this.contacts = this.loadContactsFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('portfolio-projects');
      return stored ? JSON.parse(stored) : [...INITIAL_PROJECTS];
    } catch {
      return [...INITIAL_PROJECTS];
    }
  }

  loadContactsFromStorage() {
    try {
      const stored = localStorage.getItem('portfolio-contacts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('portfolio-projects', JSON.stringify(this.projects));
    } catch (error) {
      console.error('Failed to save projects to storage:', error);
    }
  }

  saveContactsToStorage() {
    try {
      localStorage.setItem('portfolio-contacts', JSON.stringify(this.contacts));
    } catch (error) {
      console.error('Failed to save contacts to storage:', error);
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchAll() {
    await this.delay(CONFIG.API_DELAY.FETCH);
    return [...this.projects].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  async save(project) {
    await this.delay(CONFIG.API_DELAY.SAVE);
    
    const projectData = {
      ...project,
      technologies: Array.isArray(project.technologies) 
        ? project.technologies 
        : project.technologies.split(',').map(tech => tech.trim()).filter(tech => tech),
      updatedAt: new Date().toISOString(),
      projectImage: project.projectImage || null,
      bannerImage: project.bannerImage || null,
    };

    if (project._id) {
      // Update existing project
      this.projects = this.projects.map(p => 
        p._id === project._id ? { ...p, ...projectData } : p
      );
    } else {
      // Create new project
      const newProject = {
        ...projectData,
        _id: 'p' + Date.now() + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      this.projects.unshift(newProject);
    }

    this.saveToStorage();
    return projectData._id ? this.projects.find(p => p._id === projectData._id) : this.projects[0];
  }

  async delete(id) {
    await this.delay(CONFIG.API_DELAY.DELETE);
    this.projects = this.projects.filter(p => p._id !== id);
    this.saveToStorage();
  }

  async contact(data) {
    await this.delay(CONFIG.API_DELAY.CONTACT);
    
    const contactData = {
      ...data,
      _id: 'c' + Date.now() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      read: false,
      status: 'new'
    };

    this.contacts.unshift(contactData);
    this.saveContactsToStorage();
    
    return { 
      success: true, 
      message: 'Thank you for your message! I will get back to you soon.',
      contactId: contactData._id
    };
  }

  async getContacts() {
    await this.delay(CONFIG.API_DELAY.FETCH);
    return [...this.contacts].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  async markAsRead(contactId) {
    await this.delay(200);
    this.contacts = this.contacts.map(contact =>
      contact._id === contactId ? { ...contact, read: true, status: 'read' } : contact
    );
    this.saveContactsToStorage();
    return true;
  }

  async markAsReplied(contactId) {
    await this.delay(200);
    this.contacts = this.contacts.map(contact =>
      contact._id === contactId ? { ...contact, status: 'replied' } : contact
    );
    this.saveContactsToStorage();
    return true;
  }

  async deleteContact(contactId) {
    await this.delay(CONFIG.API_DELAY.DELETE);
    this.contacts = this.contacts.filter(contact => contact._id !== contactId);
    this.saveContactsToStorage();
    return true;
  }

  getUnreadCount() {
    return this.contacts.filter(contact => !contact.read).length;
  }
}

const projectService = new ProjectService();

// ----------------------------------------------------------------------
// Custom Hooks
// ----------------------------------------------------------------------

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const useContactNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkForNewMessages = () => {
      const count = projectService.getUnreadCount();
      setUnreadCount(count);
      
      // Show browser notification if new messages
      if (count > 0 && document.hidden) {
        if (Notification.permission === 'granted') {
          new Notification('New Portfolio Message', {
            body: `You have ${count} unread message${count !== 1 ? 's' : ''}`,
            icon: '/logo.png'
          });
        }
      }
    };

    // Check immediately
    checkForNewMessages();

    // Check every 30 seconds
    const interval = setInterval(checkForNewMessages, 30000);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => clearInterval(interval);
  }, []);

  return unreadCount;
};

// ----------------------------------------------------------------------
// Reusable Components
// ----------------------------------------------------------------------

const Button = React.memo(({ 
  children, 
  onClick, 
  disabled = false, 
  className = '', 
  color = 'indigo', 
  type = 'button', 
  size = 'default',
  loading = false
}) => {
  const classes = COLOR_MAP[color] || COLOR_MAP.indigo;
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    default: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        font-semibold transition-all duration-300 rounded-xl shadow-lg 
        ${classes.bg} 
        focus:outline-none focus:ring-4 ${classes.focus} focus:ring-opacity-75 
        hover:scale-[1.02] active:scale-[0.98] 
        ${classes.disabled} disabled:cursor-not-allowed disabled:transform-none
        ${sizeClasses[size]} 
        ${loading ? 'opacity-75' : ''}
        ${className}
      `}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {children}
        </div>
      ) : children}
    </button>
  );
});

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16'
  };

  return (
    <div className={`flex justify-center items-center py-10 ${className}`}>
      <svg className={`animate-spin text-indigo-600 ${sizeClasses[size]}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );
};

const InputField = React.memo(({ 
  label, 
  name, 
  value, 
  onChange, 
  type = 'text', 
  required = false, 
  placeholder = '', 
  error,
  disabled = false
}) => {
  const inputId = useRef(`input-${name}-${Math.random().toString(36).substr(2, 9)}`);

  return (
    <div>
      <label htmlFor={inputId.current} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        id={inputId.current}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full p-3 border rounded-lg transition-colors duration-200
          focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        `}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
});

const TextareaField = React.memo(({ 
  label, 
  name, 
  value, 
  onChange, 
  required = false, 
  error,
  disabled = false,
  rows = 4
}) => {
  const textareaId = useRef(`textarea-${name}-${Math.random().toString(36).substr(2, 9)}`);

  return (
    <div>
      <label htmlFor={textareaId.current} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        id={textareaId.current}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`
          w-full p-3 border rounded-lg transition-colors duration-200 resize-vertical
          focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        `}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
});

// ----------------------------------------------------------------------
// Modal Components
// ----------------------------------------------------------------------

const Modal = ({ show, onClose, children, size = 'md' }) => {
  const modalRef = useRef();

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div 
        ref={modalRef}
        className={`bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} transform transition-all duration-300 scale-100 opacity-100 max-h-[90vh] overflow-y-auto`}
      >
        {children}
      </div>
    </div>
  );
};

const ConfirmModal = ({ show, onConfirm, onCancel, title, message, confirmText = 'Delete', cancelText = 'Cancel' }) => {
  return (
    <Modal show={show} onClose={onCancel} size="sm">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <Button onClick={onCancel} color="gray" size="sm">
            {cancelText}
          </Button>
          <Button onClick={onConfirm} color="red" size="sm">
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const PasswordModal = ({ show, onClose, onSuccess, title = "Admin Login Required", description }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsChecking(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (password === CONFIG.ADMIN_PASSWORD) {
      onSuccess();
      setPassword('');
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
    setIsChecking(false);
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <Modal show={show} onClose={handleClose}>
      <div className="p-8">
        <div className="flex items-center mb-4">
          <div className="bg-yellow-100 p-2 rounded-lg mr-3">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
        </div>
        
        {description && (
          <p className="text-gray-600 mb-6 text-sm">{description}</p>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            required
            error={error}
            placeholder="Enter administrator password"
            disabled={isChecking}
          />
          
          <div className="flex justify-end space-x-4 pt-2">
            <Button onClick={handleClose} color="gray" size="sm" disabled={isChecking} type="button">
              Cancel
            </Button>
            <Button type="submit" color="indigo" size="sm" loading={isChecking}>
              Login
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
// ----------------------------------------------------------------------
// Enhanced ImageUpload Component
// ----------------------------------------------------------------------

const ImageUpload = React.memo(({ 
  label, 
  currentImage, 
  onImageChange, 
  className = '', 
  requiresAuth = false,
  variant = 'profile'
}) => {
  const [previewUrl, setPreviewUrl] = useState(currentImage);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [tempFile, setTempFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef();

  const variantConfig = {
    profile: {
      size: 'w-32 h-32',
      shape: 'rounded-full',
      label: 'Profile Image'
    },
    project: {
      size: 'w-64 h-48',
      shape: 'rounded-2xl',
      label: 'Project Screenshot'
    },
    banner: {
      size: 'w-full h-48',
      shape: 'rounded-lg',
      label: 'Project Banner'
    }
  };

  const config = variantConfig[variant] || variantConfig.profile;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      validateImageFile(file);

      if (requiresAuth) {
        setTempFile(file);
        setShowPasswordModal(true);
      } else {
        processFileUpload(file);
      }
    } catch (error) {
      alert(error.message);
      resetFileInput();
    }
  };

  const processFileUpload = (file) => {
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    setTimeout(() => {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      onImageChange(file);
      setTempFile(null);
      setUploadProgress(0);
      resetFileInput();
      clearInterval(progressInterval);
    }, 1000);
  };

  const handleRemoveImage = () => {
    if (requiresAuth) {
      setShowPasswordModal(true);
    } else {
      setPreviewUrl(null);
      onImageChange(null);
      setUploadProgress(0);
    }
  };

  const handleAuthSuccess = () => {
    if (tempFile) {
      processFileUpload(tempFile);
    } else {
      setPreviewUrl(null);
      onImageChange(null);
    }
    setShowPasswordModal(false);
  };

  const handleAuthClose = () => {
    setShowPasswordModal(false);
    setTempFile(null);
    resetFileInput();
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    setPreviewUrl(currentImage);
  }, [currentImage]);

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">{label || config.label}</label>
      
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
        {/* Image Preview */}
        <div className="flex-shrink-0 relative">
          {previewUrl ? (
            <div className="relative group">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className={`${config.size} object-cover border-4 border-indigo-200 shadow-lg ${config.shape}`}
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg z-10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {requiresAuth && (
                <div className={`absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${config.shape}`}>
                  <span className="text-white text-xs font-medium text-center px-2">
                    Admin required
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className={`${config.size} bg-gray-200 border-4 border-dashed border-gray-300 flex items-center justify-center ${config.shape}`}>
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center ${config.shape}`}>
              <div className="text-white text-center">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                <span className="text-sm">{uploadProgress}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col space-y-3">
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={uploadProgress > 0 && uploadProgress < 100}
              className="flex flex-col items-center px-4 py-6 bg-white text-blue-600 rounded-lg border-2 border-dashed border-blue-300 cursor-pointer hover:bg-blue-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-sm font-medium text-center">
                {requiresAuth ? 'Admin: Update Image' : 'Choose Image'}
              </span>
            </button>
            
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploadProgress > 0 && uploadProgress < 100}
            />
            
            <div className="space-y-1">
              <p className="text-xs text-gray-500 text-center">
                PNG, JPG, JPEG up to 5MB
              </p>
              {requiresAuth && (
                <p className="text-xs text-orange-600 font-medium text-center">
                  🔒 Password: "dame"
                </p>
              )}
              {variant === 'project' && (
                <p className="text-xs text-blue-600 text-center">
                  Recommended: 1280x720px or 16:9 ratio
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <PasswordModal
        show={showPasswordModal}
        onClose={handleAuthClose}
        onSuccess={handleAuthSuccess}
        title="Admin Verification Required"
        description={`To ${tempFile ? 'upload image' : 'remove image'}, please enter the administrator password: "project"`}
      />
    </div>
  );
});

// ----------------------------------------------------------------------
// Enhanced ProjectForm Component with Image Upload
// ----------------------------------------------------------------------

const ProjectForm = ({ projectToEdit, onSave, onCancel }) => {
  const initialFormState = useMemo(() => ({
    title: '',
    description: '',
    technologies: '',
    liveUrl: '',
    githubUrl: '',
    projectImage: null,
    bannerImage: null,
  }), []);

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [imagePreview, setImagePreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  useEffect(() => {
    if (projectToEdit) {
      setFormData({
        ...projectToEdit,
        technologies: Array.isArray(projectToEdit.technologies)
          ? projectToEdit.technologies.join(', ')
          : projectToEdit.technologies || '',
        projectImage: projectToEdit.projectImage || null,
        bannerImage: projectToEdit.bannerImage || null,
      });
      setImagePreview(projectToEdit.projectImage || null);
      setBannerPreview(projectToEdit.bannerImage || null);
    } else {
      setFormData(initialFormState);
      setImagePreview(null);
      setBannerPreview(null);
    }
  }, [projectToEdit, initialFormState]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (file, type = 'projectImage') => {
    if (file) {
      setFormData(prev => ({ ...prev, [type]: file }));
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      if (type === 'projectImage') {
        setImagePreview(objectUrl);
      } else {
        setBannerPreview(objectUrl);
      }
    } else {
      setFormData(prev => ({ ...prev, [type]: null }));
      if (type === 'projectImage') {
        setImagePreview(null);
      } else {
        setBannerPreview(null);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (formData.liveUrl && !isValidUrl(formData.liveUrl)) {
      newErrors.liveUrl = 'Please enter a valid URL';
    }

    if (formData.githubUrl && !isValidUrl(formData.githubUrl)) {
      newErrors.githubUrl = 'Please enter a valid URL';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setStatus('saving');
    setErrors({});

    try {
      const projectToSave = {
        ...formData,
        technologies: formData.technologies
          .split(',')
          .map(tech => tech.trim())
          .filter(tech => tech.length > 0),
        projectImage: formData.projectImage,
        bannerImage: formData.bannerImage,
      };

      if (projectToEdit?._id) {
        projectToSave._id = projectToEdit._id;
      }

      const savedProject = await projectService.save(projectToSave);
      setStatus('success');
      
      setTimeout(() => {
        onSave(savedProject);
      }, 100);
    } catch (error) {
      console.error('Project Save Error:', error);
      setStatus('error');
      setErrors({ general: 'Failed to save project. Please try again.' });
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-2xl border border-indigo-200 max-w-4xl mx-auto">
      <h3 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-3">
        {projectToEdit ? 'Edit Project' : 'Add New Project'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm font-medium">{errors.general}</p>
          </div>
        )}

        {/* Banner Image Upload */}
        <ImageUpload
          label="Project Banner Image"
          currentImage={bannerPreview}
          onImageChange={(file) => handleImageChange(file, 'bannerImage')}
          variant="banner"
          requiresAuth={false}
        />

        {/* Project Screenshot Upload */}
        <ImageUpload
          label="Project Screenshot"
          currentImage={imagePreview}
          onImageChange={(file) => handleImageChange(file, 'projectImage')}
          variant="project"
          requiresAuth={false}
        />

        <InputField 
          label="Project Title" 
          name="title" 
          value={formData.title} 
          onChange={handleChange} 
          required 
          error={errors.title}
          placeholder="Enter project title"
        />
        
        <TextareaField 
          label="Project Description" 
          name="description" 
          value={formData.description} 
          onChange={handleChange} 
          required 
          error={errors.description}
          placeholder="Describe your project in detail..."
          rows={4}
        />
        
        <InputField 
          label="Technologies (comma-separated)" 
          name="technologies" 
          value={formData.technologies} 
          onChange={handleChange} 
          placeholder="React, Node.js, MongoDB, Express"
          error={errors.technologies}
        />
        
        <div className="grid md:grid-cols-2 gap-4">
          <InputField 
            label="Live Demo URL" 
            name="liveUrl" 
            value={formData.liveUrl} 
            onChange={handleChange} 
            type="url"
            placeholder="https://your-project.com"
            error={errors.liveUrl}
          />
          
          <InputField 
            label="GitHub Repository URL" 
            name="githubUrl" 
            value={formData.githubUrl} 
            onChange={handleChange} 
            type="url"
            placeholder="https://github.com/your-username/project"
            error={errors.githubUrl}
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <Button 
            type="submit" 
            loading={status === 'saving'} 
            className="flex-1"
            disabled={status === 'saving'}
          >
            {projectToEdit ? 'Update Project' : 'Create Project'}
          </Button>
          <Button 
            type="button" 
            onClick={onCancel} 
            color="gray" 
            className="flex-1"
            disabled={status === 'saving'}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

// ----------------------------------------------------------------------
// ProjectCard Component
// ----------------------------------------------------------------------

const ProjectCard = React.memo(({ 
  title, 
  description, 
  technologies = [], 
  liveUrl, 
  githubUrl,
  createdAt,
  projectImage
}) => {
  const handleLinkClick = (e, url, type) => {
    if (!url || url.includes('example.com')) {
      e.preventDefault();
      console.log(`Demo Project: ${type} URL is simulated/not available.`);
      // You could show a toast notification here
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 border-indigo-600 flex flex-col h-full group">
      {/* Project Image */}
      {projectImage && (
        <div className="mb-4 -mx-6 -mt-6">
          <img 
            src={projectImage} 
            alt={title}
            className="w-full h-48 object-cover rounded-t-xl"
          />
        </div>
      )}
      
      <div className="flex-grow">
        <h3 className="text-2xl font-bold text-indigo-700 mb-3 group-hover:text-indigo-800 transition-colors">
          {title}
        </h3>
        
        <p className="text-gray-600 mb-4 leading-relaxed">{description}</p>
        
        {technologies && technologies.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {technologies.map((tech, index) => (
              <span 
                key={index} 
                className="px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full shadow-sm transition-colors hover:bg-indigo-200"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
        <div className="flex space-x-4">
          {liveUrl && (
            <a
              href={liveUrl}
              onClick={(e) => handleLinkClick(e, liveUrl, 'Live Demo')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-green-600 hover:text-green-800 transition-colors duration-150 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Live Demo
            </a>
          )}
          {githubUrl && (
            <a
              href={githubUrl}
              onClick={(e) => handleLinkClick(e, githubUrl, 'GitHub')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors duration-150 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              GitHub
            </a>
          )}
        </div>
        
        {createdAt && (
          <span className="text-xs text-gray-400">
            {formatDate(createdAt)}
          </span>
        )}
      </div>
    </div>
  );
});

// ----------------------------------------------------------------------
// ProjectList Component
// ----------------------------------------------------------------------

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTechnology, setSelectedTechnology] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const data = await projectService.fetchAll();
        setProjects(data);
      } catch (err) {
        setError('Failed to load projects. Please try refreshing the page.');
        console.error('Project loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const uniqueTechnologies = useMemo(() => {
    const allTechnologies = projects.flatMap(p => p.technologies || []);
    const uniqueTechs = [...new Set(allTechnologies)].sort();
    return ['All', ...uniqueTechs];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Filter by technology
    if (selectedTechnology !== 'All') {
      filtered = filtered.filter(p => 
        p.technologies && p.technologies.includes(selectedTechnology)
      );
    }

    // Filter by search term
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        (p.technologies && p.technologies.some(tech => 
          tech.toLowerCase().includes(term)
        ))
      );
    }

    return filtered;
  }, [projects, selectedTechnology, debouncedSearchTerm]);

  const handleFilterClick = (tech) => {
    setSelectedTechnology(tech);
  };

  if (loading) return <LoadingSpinner />;
  
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 font-medium">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            color="red" 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section id="projects" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Featured Projects</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Here are some of my recent projects that showcase my skills in full-stack development and problem-solving.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-12 space-y-4">
          {/* Search Input */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-4 pl-12 pr-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Technology Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {uniqueTechnologies.map(tech => (
              <button
                key={tech}
                onClick={() => handleFilterClick(tech)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 shadow-md 
                  ${selectedTechnology === tech
                    ? 'bg-indigo-600 text-white transform scale-[1.05] shadow-indigo-300/50'
                    : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200'
                }`}
              >
                {tech}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.length > 0 ? (
            filteredProjects.map(project => (
              <ProjectCard 
                key={project._id}
                title={project.title}
                description={project.description}
                technologies={project.technologies}
                liveUrl={project.liveUrl}
                githubUrl={project.githubUrl}
                createdAt={project.createdAt}
                projectImage={project.projectImage}
              />
            ))
          ) : (
            <div className="lg:col-span-3 text-center p-12 bg-white rounded-xl shadow-md">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No projects found</h3>
              <p className="text-gray-500">
                {searchTerm || selectedTechnology !== 'All' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No projects have been added yet.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="text-center mt-8">
          <p className="text-gray-500">
            Showing {filteredProjects.length} of {projects.length} projects
            {(searchTerm || selectedTechnology !== 'All') && ' (filtered)'}
          </p>
        </div>
      </div>
    </section>
  );
};

// ----------------------------------------------------------------------
// ContactForm Component
// ----------------------------------------------------------------------

const ContactForm = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    message: '' 
  });
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      errors.message = 'Message must be at least 10 characters';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setMessage({ type: 'error', text: 'Please fix the errors above.' });
      return;
    }

    setStatus('submitting');
    setMessage('');

    try {
      const result = await projectService.contact(formData);
      setStatus('success');
      setMessage({ 
        type: 'success', 
        text: result.message || 'Message sent successfully! I will get back to you soon.' 
      });
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
      setStatus('error');
      setMessage({ 
        type: 'error', 
        text: 'Failed to send message. Please try again later.' 
      });
    }

    // Clear message after 5 seconds
    setTimeout(() => {
      setMessage('');
    }, 5000);
  };

  return (
    <div className="p-8 bg-white rounded-xl shadow-2xl">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-3">Get In Touch</h2>
      
      {message && (
        <div 
          className={`p-4 mb-6 rounded-lg font-medium ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <InputField 
          label="Full Name" 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          required 
          placeholder="Enter your full name"
          disabled={status === 'submitting'}
        />
        
        <InputField 
          label="Email Address" 
          name="email" 
          value={formData.email} 
          onChange={handleChange} 
          required 
          type="email"
          placeholder="your.email@example.com"
          disabled={status === 'submitting'}
        />
        
        <TextareaField 
          label="Your Message" 
          name="message" 
          value={formData.message} 
          onChange={handleChange} 
          required 
          placeholder="Tell me about your project or inquiry..."
          rows={5}
          disabled={status === 'submitting'}
        />
        
        <Button 
          type="submit" 
          loading={status === 'submitting'}
          disabled={status === 'submitting'}
          className="w-full"
        >
          Send Message
        </Button>
      </form>
      
      <p className="text-xs text-gray-400 mt-4 text-center">
        Note: This form uses a mock API for demonstration purposes.
      </p>
    </div>
  );
};

// ----------------------------------------------------------------------
// ContactDetail Component
// ----------------------------------------------------------------------

const ContactDetail = React.memo(({ icon, text, href }) => {
  const IconComponent = useMemo(() => {
    const commonClassName = "w-5 h-5 text-indigo-600 mr-3 flex-shrink-0";

    const icons = {
      Mail: (props) => (
        <svg {...props} className={commonClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      Phone: (props) => (
        <svg {...props} className={commonClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      MapPin: (props) => (
        <svg {...props} className={commonClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    };

    return icons[icon] || icons.MapPin;
  }, [icon]);

  const content = (
    <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
      <IconComponent />
      <span className="text-gray-700">{text}</span>
    </div>
  );

  if (href) {
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block hover:no-underline"
      >
        {content}
      </a>
    );
  }

  return content;
});

// ----------------------------------------------------------------------
// ContactNotifications Component
// ----------------------------------------------------------------------

const ContactNotifications = ({ count, onClick }) => {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="relative p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 group"
      aria-label={`${count} unread messages`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM8.5 14.5A2.5 2.5 0 0011 12V4.5a4.5 4.5 0 10-9 0V12a2.5 2.5 0 002.5 2.5z" />
      </svg>
      
      {/* Notification Badge */}
      <span className="absolute -top-1 -right-1 bg-white text-red-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border border-red-200 shadow-lg transform group-hover:scale-110 transition-transform duration-200">
        {count > 9 ? '9+' : count}
      </span>

      {/* Pulse Animation */}
      <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75 group-hover:animate-none"></span>
    </button>
  );
};

// ----------------------------------------------------------------------
// ContactManager Component
// ----------------------------------------------------------------------

const ContactManager = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [filter, setFilter] = useState('all'); // all, new, read, replied

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await projectService.getContacts();
      setContacts(data);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (contactId) => {
    await projectService.markAsRead(contactId);
    loadContacts();
  };

  const handleMarkAsReplied = async (contactId) => {
    await projectService.markAsReplied(contactId);
    loadContacts();
  };

  const handleDeleteContact = async (contactId) => {
    if (window.confirm('Are you sure you want to delete this contact message?')) {
      await projectService.deleteContact(contactId);
      loadContacts();
      if (selectedContact && selectedContact._id === contactId) {
        setSelectedContact(null);
      }
    }
  };

  const filteredContacts = contacts.filter(contact => {
    if (filter === 'all') return true;
    if (filter === 'new') return !contact.read;
    if (filter === 'read') return contact.read && contact.status !== 'replied';
    if (filter === 'replied') return contact.status === 'replied';
    return true;
  });

  const unreadCount = contacts.filter(contact => !contact.read).length;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Contact Messages
          </h2>
          <p className="text-gray-600">
            Manage messages from your portfolio visitors
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Notification Badge */}
          {unreadCount > 0 && (
            <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold border border-red-200">
              {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
            </div>
          )}
          
          {/* Filter Buttons */}
          <div className="flex gap-2">
            {['all', 'new', 'read', 'replied'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                  filter === filterType
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contacts List */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Messages List */}
        <div className="space-y-4">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages</h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? "You haven't received any messages yet."
                  : `No ${filter} messages found.`
                }
              </p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact._id}
                className={`bg-white rounded-xl shadow-md border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
                  selectedContact?._id === contact._id
                    ? 'border-indigo-500 bg-indigo-50'
                    : contact.read
                    ? 'border-gray-200'
                    : 'border-blue-500 bg-blue-50'
                }`}
                onClick={() => {
                  setSelectedContact(contact);
                  if (!contact.read) {
                    handleMarkAsRead(contact._id);
                  }
                }}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                        <p className="text-sm text-gray-600">{contact.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!contact.read && (
                        <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                      )}
                      <span className="text-xs text-gray-500">
                        {formatDate(contact.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 line-clamp-2 text-sm">
                    {contact.message}
                  </p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        contact.status === 'new' 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : contact.status === 'replied'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {contact.status}
                      </span>
                    </div>
                    
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsReplied(contact._id);
                        }}
                        className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                        title="Mark as replied"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                      
                      <a
                        href={`mailto:${contact.email}?subject=Re: Your message from portfolio&body=Hi ${contact.name},`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-indigo-600 hover:bg-indigo-100 rounded transition-colors"
                        title="Reply via email"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </a>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteContact(contact._id);
                        }}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="Delete message"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Detail */}
        <div className="lg:sticky lg:top-6 lg:h-fit">
          {selectedContact ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedContact.name}</h3>
                  <p className="text-gray-600">{selectedContact.email}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {formatDateTime(selectedContact.createdAt)}
                </span>
              </div>
              
              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedContact.message}</p>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <a
                  href={`mailto:${selectedContact.email}?subject=Re: Your message from portfolio&body=Hi ${selectedContact.name},%0D%0A%0D%0AThank you for reaching out! `}
                  className="btn btn-primary flex-1"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Reply via Email
                </a>
                
                <button
                  onClick={() => handleMarkAsReplied(selectedContact._id)}
                  className="btn btn-success"
                  disabled={selectedContact.status === 'replied'}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Mark Replied
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a message</h3>
              <p className="text-gray-500">Click on a message to view its details and reply</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// AboutMe Component
// ----------------------------------------------------------------------

const AboutMe = ({ profileImage, onImageChange, isAdminLoggedIn = false }) => {
  const skills = [
    { category: 'Frontend', items: ['React', 'TypeScript', 'Tailwind CSS', 'HTML/CSS', 'JavaScript (ES6+)'] },
    { category: 'Backend', items: ['Node.js', 'Express', 'MongoDB', 'RESTful APIs', 'Authentication'] },
    { category: 'Tools & Methods', items: ['Git & GitHub', 'Agile/Scrum', 'Testing', 'DevOps', 'CI/CD'] }
  ];

  const defaultProfileImages = [
    "/da.jpg",
  ];

  const [profileImageError, setProfileImageError] = useState(false);

  return (
    <section id="about" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">About Me</h2>
          <div className="w-24 h-1 bg-indigo-600 mx-auto"></div>
        </div>

        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12">
          {/* Profile Image Section - Increased size */}
          <div className="flex-shrink-0 lg:w-2/5">
            <div className="text-center">
              <div className="relative inline-block">
                <img 
                  src={profileImage && !profileImageError ? profileImage : defaultProfileImages[0]}
                  alt="Dame Teshome Negesa"
                  className="w-96 h-96 rounded-3xl object-cover shadow-2xl border-8 border-white hover:scale-105 transition-transform duration-300"
                  onError={() => {
                    console.log('Profile image failed to load, using fallback');
                    setProfileImageError(true);
                  }}
                />
                <div className="absolute inset-0 rounded-3xl border-4 border-indigo-200 transform rotate-6 -z-10"></div>
                <div className="absolute -bottom-4 -right-4 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg">
                  <span className="font-bold">Full Stack Developer</span>
                </div>
              </div>
              
              {isAdminLoggedIn && (
                <div className="mt-4">
                  <ImageUpload
                    label="Update Profile Image"
                    currentImage={profileImage}
                    onImageChange={onImageChange}
                    requiresAuth={false}
                    variant="profile"
                  />
                </div>
              )}
            </div>
          </div>

          {/* About Content */}
          <div className="flex-1 lg:w-3/5">
            <div className="bg-gradient-to-br from-gray-50 to-indigo-50 p-8 rounded-2xl shadow-lg">
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Hi, I'm <span className="text-indigo-600">Dame Teshome Negesa</span>
              </h3>
              
              <div className="space-y-6 text-lg text-gray-700">
                <p>
                  I'm a passionate <strong>5th-year Software Engineering student</strong> at <strong>Injibara University</strong>, 
                  specializing in full-stack web development with the <strong>MERN stack</strong> (MongoDB, Express, React, Node.js).
                </p>
                
                <p>
                  My journey in software development started with a curiosity about how technology can solve real-world problems. 
                  Over the years, I've developed a strong foundation in both frontend and backend technologies, with particular 
                  expertise in creating responsive, user-friendly web applications.
                </p>

                {/* Skills Section */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  {skills.map((skillGroup, index) => (
                    <div 
                      key={skillGroup.category}
                      className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500 hover:shadow-lg transition-shadow duration-300"
                    >
                      <h4 className="font-bold text-gray-900 mb-3 text-lg">{skillGroup.category}</h4>
                      <ul className="space-y-2 text-sm">
                        {skillGroup.items.map((skill, skillIndex) => (
                          <li key={skillIndex} className="flex items-center">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ----------------------------------------------------------------------
// Footer Component
// ----------------------------------------------------------------------

const Footer = () => {
  const socialLinks = [
    {
      name: 'GitHub',
      url: 'https://github.com/dameteshome',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      )
    },
    {
      name: 'LinkedIn',
      url: 'https://linkedin.com/in/dameteshome',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      )
    },
    {
      name: 'Twitter',
      url: 'https://twitter.com/dameteshome',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      )
    },
    {
      name: 'Portfolio',
      url: 'https://dameteshome.dev',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      )
    }
  ];

  return (
    <footer className="bg-gray-900 text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">Dame Teshome Negesa</h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Passionate Software Engineering student specializing in full-stack development with the MERN stack. 
            Always eager to learn new technologies and take on challenging projects.
          </p>
          
          {/* Contact Information */}
          <div className="flex justify-center space-x-6 mb-6">
            <ContactDetail 
              icon="Mail" 
              text="dameteshoma77@gmail.com"
              href="mailto:dameteshoma77@gmail.com"
            />
            <ContactDetail 
              icon="Phone" 
              text="+251 931 466 890"
              href="tel:+251931466890"
            />
          </div>

          {/* Social Media Links */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4 text-gray-200">Follow my work</h4>
            <div className="flex justify-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-800 hover:bg-indigo-600 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110 hover:shadow-lg group"
                  aria-label={`Follow on ${social.name}`}
                  title={social.name}
                >
                  <div className="flex items-center justify-center w-6 h-6">
                    {social.icon}
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-700 pt-6">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Dame Teshome Negesa. All rights reserved. 
              Built with React and modern web technologies.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ----------------------------------------------------------------------
// Home Component
// ----------------------------------------------------------------------

const Home = ({ isAdminLoggedIn = false, profileImage, onProfileImageChange }) => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased text-gray-800">
      <main>
        {/* Hero Section */}
        <section id="home" className="relative py-20 mb-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="animate-fade-in-up">
              <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
                Hello, I'm <span className="text-yellow-300">Dame Teshome Negesa</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
                A passionate <strong>Software Engineering Student</strong> & <strong>Full-Stack Developer</strong> 
                specializing in creating digital solutions that make a difference.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })}
                  color="white"
                  size="lg"
                >
                  Learn More About Me
                </Button>
                <Button 
                  onClick={() => document.getElementById('projects').scrollIntoView({ behavior: 'smooth' })}
                  color="yellow"
                  size="lg"
                >
                  View My Work
                </Button>
                <Button 
                  onClick={() => window.open('/Dame_Teshome_CV.pdf', '_blank')}
                  color="green"
                  size="lg"
                >
                  Download CV
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
        </section>
        
        <AboutMe 
          profileImage={profileImage} 
          onImageChange={onProfileImageChange}
          isAdminLoggedIn={isAdminLoggedIn}
        />
        
        <ProjectList />
        
        <section id="contact" className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div className="space-y-6">
                <h2 className="text-4xl font-extrabold text-gray-900">Let's Connect</h2>
                <p className="text-lg text-gray-600">
                  As a final-year software engineering student, I am actively seeking opportunities to contribute 
                  to cutting-edge projects. Feel free to reach out with project ideas, internship opportunities, 
                  or professional inquiries!
                </p>
                <div className="space-y-4">
                  <ContactDetail 
                    icon="Mail" 
                    text="dameteshoma77@gmail.com"
                    href="mailto:dameteshoma77@gmail.com"
                  />
                  <ContactDetail 
                    icon="Phone" 
                    text="+251 931 466 890"
                    href="tel:+251931466890"
                  />
                  <ContactDetail 
                    icon="MapPin" 
                    text="Oromia, Ethiopia"
                  />
                </div>
              </div>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};


// ----------------------------------------------------------------------
// Header Component (Updated)
// ----------------------------------------------------------------------

const Header = ({ navigate, handleAdminAccessAttempt, isAdminLoggedIn = false, handleLogout, currentPage = 'home', unreadCount = 0 }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [mobileLogoError, setMobileLogoError] = useState(false);
  const [menuLogoError, setMenuLogoError] = useState(false);

  const navItems = [
    { label: 'About', id: 'about', page: 'home' },
    { label: 'Projects', id: 'projects', page: 'home' },
    { label: 'Contact', id: 'contact', page: 'home' },
  ];

  const adminNavItems = [
    { label: 'Dashboard', id: 'admin', page: 'admin' }
  ];

  const scrollToSection = (sectionId) => {
    if (currentPage !== 'home') {
      navigate('home');
      // Use setTimeout to wait for navigation then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMobileMenuOpen(false);
  };

  const handleNavigation = (page) => {
    navigate(page);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50 backdrop-blur-md bg-white/90 hidden md:block">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          {/* Logo and Name - Increased size */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {!logoError ? (
                <img 
                  src="/login.jpg"
                  alt="Dame Teshome Logo"
                  className="w-16 h-16 rounded-full object-cover border-4 border-indigo-200 shadow-lg hover:scale-105 transition-transform duration-200"
                  onError={() => {
                    console.log('Logo image failed to load, using fallback');
                    setLogoError(true);
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-4 border-indigo-200 shadow-lg">
                  <span className="text-white font-bold text-xl">DT</span>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => navigate('home')}
                className="text-2xl font-bold text-indigo-600 cursor-pointer bg-transparent border-0 hover:text-indigo-700 transition duration-150 text-left"
              >
                Dame Teshome
              </button>
              <p className="text-sm text-gray-600 mt-1">Full Stack Developer</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <div className="flex space-x-4">
              {/* Portfolio Navigation Items - Always show on home page */}
              {(currentPage === 'home') && navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-gray-700 hover:text-indigo-600 font-medium px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors duration-200 text-lg"
                >
                  {item.label}
                </button>
              ))}
              
              {/* Dashboard Button - Show when admin is logged in */}
              {isAdminLoggedIn && adminNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation('admin')}
                  className={`font-medium px-4 py-2 rounded-lg transition-colors duration-200 text-lg ${
                    currentPage === 'admin' 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                  }`}
                >
                  📊 {item.label}
                  {currentPage === 'admin' && (
                    <span className="ml-2">⚡</span>
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex items-center space-x-4">
              {isAdminLoggedIn ? (
                <>
                  <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-2 rounded-full border border-green-200">
                    ✅ Admin Mode
                  </span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center border-2 border-white font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  <Button 
                    onClick={handleLogout} 
                    color="red"
                    size="sm"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                currentPage === 'home' && (
                  <Button 
                    onClick={handleAdminAccessAttempt} 
                    color="blue"
                    size="sm"
                  >
                    Admin
                  </Button>
                )
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50 md:hidden">
        <nav className="px-4 py-3 flex justify-between items-center">
          {/* Logo and Name - Increased size for mobile */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {!mobileLogoError ? (
                <img 
                  src="/login.jpg"
                  alt="Dame Teshome Logo"
                  className="w-12 h-12 rounded-full object-cover border-3 border-indigo-200 shadow-md"
                  onError={() => {
                    console.log('Mobile logo image failed to load, using fallback');
                    setMobileLogoError(true);
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-3 border-indigo-200 shadow-md">
                  <span className="text-white font-bold text-lg">DT</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate('home')}
              className="text-xl font-bold text-indigo-600"
            >
              {currentPage === 'admin' ? 'Dame Teshome' : 'Dame Teshome'}
              <p className="text-sm text-gray-600 mt-1">Full Stack Developer</p>
            </button>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-3">
            {isAdminLoggedIn && (
              <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full border border-green-200">
                Admin
              </span>
            )}
            {isAdminLoggedIn && unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border border-white">
                {unreadCount}
              </span>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-3 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-white z-40 md:hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  {!menuLogoError ? (
                    <img 
                      src="/login.jpg"
                      alt="Dame Teshome Logo"
                      className="w-16 h-16 rounded-full object-cover border-4 border-indigo-200 shadow-lg"
                      onError={() => {
                        console.log('/login.jpg');
                        setMenuLogoError(true);
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-4 border-indigo-200 shadow-lg">
                      <span className="text-white font-bold text-xl">DT</span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-indigo-600">
                      {currentPage === 'admin' ? 'Admin Menu' : 'Dame Teshome'}
                    </span>
                    <span className="text-sm text-gray-600">Full Stack Developer</span>
                  </div>
                </div>
                {isAdminLoggedIn && (
                  <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full border border-green-200">
                    Admin Mode
                  </span>
                )}
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-3 rounded-lg hover:bg-gray-100 border border-gray-200"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Mobile Navigation Items */}
              <div className="space-y-3">
                {/* Portfolio Navigation - Show on all pages */}
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="w-full text-left p-4 text-lg font-medium text-gray-700 hover:bg-indigo-50 rounded-xl transition-colors flex items-center border border-gray-100"
                  >
                    <span className="text-xl">{item.label}</span>
                  </button>
                ))}
                
                {/* Dashboard Button - Show when admin is logged in */}
                {isAdminLoggedIn && adminNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation('admin')}
                    className={`w-full text-left p-4 text-lg font-medium rounded-xl transition-colors flex items-center border ${
                      currentPage === 'admin' 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 border-blue-700'
                    }`}
                  >
                    <span className="text-xl">📊 {item.label}</span>
                    {currentPage === 'admin' && (
                      <span className="ml-2 text-2xl">⚡</span>
                    )}
                  </button>
                ))}
                
                {/* Admin/Logout Button */}
                {isAdminLoggedIn ? (
                  <Button 
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }} 
                    color="red"
                    className="w-full justify-center mt-6 py-4 text-lg"
                    size="lg"
                  >
                    🚪 Logout Admin
                  </Button>
                ) : (
                  <Button 
                    onClick={() => {
                      handleAdminAccessAttempt();
                      setIsMobileMenuOpen(false);
                    }} 
                    color="blue"
                    className="w-full justify-center mt-6 py-4 text-lg"
                    size="lg"
                  >
                    🔑 Admin Login
                  </Button>
                )}
              </div>

              {/* Page Navigation */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-4 text-lg">Quick Navigation:</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      navigate('home');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left p-4 rounded-xl transition-colors border text-lg ${
                      currentPage === 'home' 
                        ? 'bg-indigo-100 text-indigo-700 font-medium border-indigo-300' 
                        : 'text-gray-700 hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    🏠 Portfolio Home
                  </button>
                  {isAdminLoggedIn && (
                    <button
                      onClick={() => {
                        navigate('admin');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left p-4 rounded-xl transition-colors border text-lg ${
                        currentPage === 'admin' 
                          ? 'bg-blue-100 text-blue-700 font-medium border-blue-300' 
                          : 'text-gray-700 hover:bg-gray-100 border-gray-200'
                      }`}
                    >
                      📊 Admin Dashboard
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation - Show on all pages when not on admin page */}
      {currentPage !== 'admin' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-4 flex justify-around items-center safe-area-bottom md:hidden shadow-lg">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="flex flex-col items-center p-3 text-gray-600 hover:text-indigo-600 transition-colors flex-1"
            >
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
          {isAdminLoggedIn ? (
            <button
              onClick={() => navigate('admin')}
              className="flex flex-col items-center p-3 text-blue-600 hover:text-blue-800 transition-colors flex-1"
            >
              <span className="text-xs font-medium">📊 Dashboard</span>
            </button>
          ) : (
            <button
              onClick={handleAdminAccessAttempt}
              className="flex flex-col items-center p-3 text-blue-600 hover:text-blue-800 transition-colors flex-1"
            >
              <span className="text-xs font-medium">🔑 Admin</span>
            </button>
          )}
        </nav>
      )}
    </>
  );
};

// ----------------------------------------------------------------------
// Main App Component with Centralized State
// ----------------------------------------------------------------------

const App = () => {
  const [page, setPage] = useState('home');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useLocalStorage('admin-login', false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  // Load profile image from localStorage on app start
  useEffect(() => {
    const savedProfileImage = localStorage.getItem('portfolio-profile-image');
    if (savedProfileImage) {
      setProfileImage(savedProfileImage);
    }
  }, []);

  const navigate = useCallback((newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  }, []);

  const handleAdminAccessAttempt = useCallback(() => {
    if (isAdminLoggedIn) {
      navigate('admin');
    } else {
      setShowPasswordModal(true);
    }
  }, [isAdminLoggedIn, navigate]);

  const handleLoginSuccess = useCallback(() => {
    setIsAdminLoggedIn(true);
    setShowPasswordModal(false);
    navigate('admin');
  }, [navigate, setIsAdminLoggedIn]);

  const handleLogout = useCallback(() => {
    setIsAdminLoggedIn(false);
    navigate('home');
  }, [navigate, setIsAdminLoggedIn]);

  // Shared profile image handler
  const handleProfileImageChange = useCallback((file) => {
    if (file) {
      console.log('New profile image selected:', file.name);
      const objectUrl = URL.createObjectURL(file);
      setProfileImage(objectUrl);
      // Save to localStorage for persistence
      localStorage.setItem('portfolio-profile-image', objectUrl);
    } else {
      console.log('Profile image removed');
      setProfileImage(null);
      localStorage.removeItem('portfolio-profile-image');
    }
  }, []);

  const renderPage = useCallback(() => {
    switch (page) {
      case 'admin':
        return isAdminLoggedIn ? (
          <ProjectAdmin 
            profileImage={profileImage}
            onProfileImageChange={handleProfileImageChange}
          />
        ) : (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
              <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
              <p className="text-gray-600 mb-6">Please log in to access the admin dashboard.</p>
              <Button onClick={() => setShowPasswordModal(true)}>
                Admin Login
              </Button>
            </div>
          </div>
        );
      case 'home':
      default:
        return (
          <Home 
            isAdminLoggedIn={isAdminLoggedIn}
            profileImage={profileImage}
            onProfileImageChange={handleProfileImageChange}
          />
        );
    }
  }, [page, isAdminLoggedIn, profileImage, handleProfileImageChange]);

  return (
    <>
      <Header 
        navigate={navigate} 
        handleAdminAccessAttempt={handleAdminAccessAttempt} 
        isAdminLoggedIn={isAdminLoggedIn}
        handleLogout={handleLogout}
        currentPage={page}
        unreadCount={projectService.getUnreadCount()}
      />
      {renderPage()}
      <PasswordModal
        show={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
};
// ----------------------------------------------------------------------
// Enhanced ProjectAdmin Component with Contact Management
// ----------------------------------------------------------------------

const ProjectAdmin = ({ profileImage, onProfileImageChange }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('projects');
  const unreadCount = useContactNotifications();

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.fetchAll();
      setProjects(data);
    } catch (err) {
      setError('Failed to fetch projects. Please try again.');
      console.error('Fetch projects error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSave = useCallback((savedProject) => {
    setProjects(prevProjects => {
      const existingIndex = prevProjects.findIndex(p => p._id === savedProject._id);
      if (existingIndex > -1) {
        const updated = [...prevProjects];
        updated[existingIndex] = savedProject;
        return updated;
      } else {
        return [savedProject, ...prevProjects];
      }
    });
    setEditingProject(null);
    setIsAdding(false);
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      setError(null);
      await projectService.delete(id);
      setProjects(prev => prev.filter(p => p._id !== id));
      setProjectToDelete(null);
    } catch (err) {
      setError('Failed to delete project. Please try again.');
      console.error('Delete project error:', err);
    }
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin Header */}
        <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">
                Manage your portfolio projects and contact messages
              </p>
            </div>
            
            {/* Profile Image Management */}
            <div className="mt-4 md:mt-0">
              <ImageUpload
                label="Update Profile Image"
                currentImage={profileImage}
                onImageChange={onProfileImageChange}
                requiresAuth={false}
                variant="profile"
                className="max-w-xs"
              />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'projects'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Projects ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors relative ${
                activeTab === 'contacts'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Messages
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => setError(null)} 
              color="red" 
              size="sm" 
              className="mt-2"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'projects' ? (
          <div>
            {(isAdding || editingProject) ? (
              <ProjectForm 
                projectToEdit={editingProject} 
                onSave={handleSave} 
                onCancel={() => { 
                  setEditingProject(null); 
                  setIsAdding(false); 
                }} 
              />
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Projects ({projects.length})
                  </h2>
                  <Button onClick={() => setIsAdding(true)}>
                    + Add New Project
                  </Button>
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  {projects.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                      <p className="text-gray-500 mb-4">Get started by adding your first project.</p>
                      <Button onClick={() => setIsAdding(true)}>
                        Create Your First Project
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {projects.map(project => (
                        <div key={project._id} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start space-x-4 flex-1 min-w-0">
                              {/* Project Thumbnail */}
                              {project.projectImage && (
                                <img 
                                  src={project.projectImage} 
                                  alt={project.title}
                                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                />
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-indigo-700 truncate">
                                  {project.title}
                                </h3>
                                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                  {project.description}
                                </p>
                                <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                                  <span>ID: {project._id}</span>
                                  {project.createdAt && (
                                    <span>Created: {formatDate(project.createdAt)}</span>
                                  )}
                                  {project.projectImage && (
                                    <span className="text-green-600">📷 Has image</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2 flex-shrink-0">
                              <Button 
                                onClick={() => setEditingProject(project)} 
                                color="blue" 
                                size="sm"
                              >
                                Edit
                              </Button>
                              <Button 
                                onClick={() => setProjectToDelete(project._id)}
                                color="red" 
                                size="sm"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <ContactManager />
        )}

        <ConfirmModal 
          show={!!projectToDelete}
          title="Delete Project"
          message="Are you sure you want to delete this project? This action cannot be undone and will permanently remove the project from your portfolio."
          confirmText="Delete Project"
          onConfirm={() => handleDelete(projectToDelete)}
          onCancel={() => setProjectToDelete(null)}
        />
      </div>
    </div>
  );
};


export default App;