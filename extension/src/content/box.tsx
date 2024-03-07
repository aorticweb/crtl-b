import { useState, useEffect, useRef } from 'react';
import React from 'react';


export const TextboxComponent = () => {
  const [text, setText] = useState('This is the text');
  const [isVisible, setIsVisible] = useState(true);
  const componentRef = useRef(null);

  useEffect(() => {
    const handleToggleVisibility = (event: any) => {
      setIsVisible(event.detail.isVisible);
    };
    const handleSetText = (event: any) => {
      setText(event.detail.text);
    };
    document.addEventListener('setVisibility', handleToggleVisibility);
    document.addEventListener('setText', handleSetText);
    return () => {
      document.removeEventListener('toggleVisibility', handleToggleVisibility);
      document.removeEventListener('setText', handleSetText);
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };

  const handleChange = (event: any) => {
    setText(event.target.value);
  };

  const hide = () => {
    setIsVisible(false);
  };

  return (
    <div
      ref={componentRef}
      className={`position-fixed top-0 end-0 m-3 vw-50`}
      style={{
        backgroundColor: 'white',
        border: '1px solid black',
        padding: '10px',
        display: isVisible ? 'block' : 'none',
      }}
    >
      <textarea 
        value={text} 
        onChange={handleChange} 
        className="form-control my-2"
      />
      <button 
        onClick={handleCopy} 
        className="btn btn-primary me-2"
      >
        Copyyes
      </button>
      <button 
        onClick={hide} 
        className="btn btn-secondary"
      >
        Close
      </button>
    </div>
  );
};
