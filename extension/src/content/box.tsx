import './scss/styles.scss'
import * as bootstrap from 'bootstrap'
import React, { useState, useEffect, useRef } from 'react';

export const TextboxComponent = () => {
  const [text, setText] = useState('...');
  const [isVisible, setIsVisible] = useState(false);
  const componentRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({x: 0, y: 0});
  const [dragStart, setDragStart] = useState({x: 0, y: 0});

  useEffect(() => {
    const handleMouseMove = (event: any) => {
      if (isDragging) {
        const dx = event.clientX - dragStart.x;
        const dy = event.clientY - dragStart.y;
        setPosition({
          x: position.x + dx,
          y: position.y + dy,
        });
        setDragStart({
          x: event.clientX,
          y: event.clientY,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, position]);

  useEffect(() => {
    // Listener function
    const messageListener = async (request: any, sender: any, sendResponse: any) => {
      if (request.action === "grabSelectedText") {
        const selectedText: string = window.getSelection()?.toString()!;
        sendResponse(selectedText);
        show(); // Function to show the popup and set loading text
        setText("loading...");
        return true; // to indicate asynchronous response
      }
      if (request.action === "dispLLMOutput") {
        show();
        setText(request.content);
        sendResponse("content was displayed");
        return true; // to indicate asynchronous response
      }
      if (request.action === "dispLLMFailure") {
        show();
        setText("failed to perform LLM Task");
        sendResponse("error message was displayed");
        return true; // to indicate asynchronous response
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const handleMouseDown = (event: any) => {
    setIsDragging(true);
    setDragStart({
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };

  const handleChange = (event: any) => {
    setText(event.target.value);
  };

  const hide = () => {
    setIsVisible(false);
  };

  const show = () => {
    setIsVisible(true);
  };
  return (
    <div
      ref={componentRef}
      onMouseDown={handleMouseDown}
      className={`position-fixed m-3 vw-50`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        display: isVisible ? 'block' : 'none',
        backgroundColor: 'white',
        cursor: 'move',
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
        Copy
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
