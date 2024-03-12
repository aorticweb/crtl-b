import React, { useState, useEffect, useRef } from "react";

interface Position {
  x: number;
  y: number;
}

export const TextboxComponent = () => {
  const [text, setText] = useState<string>("...");
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const componentRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [position, setPosition] = useState<Position>({
    x: window.innerWidth - 550,
    y: 0,
  });
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        const dx = event.clientX - dragStart.x;
        const dy = event.clientY - dragStart.y;
        setPosition((prevPosition) => ({
          x: prevPosition.x + dx,
          y: prevPosition.y + dy,
        }));
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
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  useEffect(() => {
    const messageListener = async (
      request: { action: string; content?: string },
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: string) => void
    ) => {
      if (request.action === "grabSelectedText") {
        const selectedText = window.getSelection()?.toString();
        sendResponse(selectedText);
        show();
        setText("loading...");
        return true;
      }
      if (request.action === "dispLLMOutput") {
        show();
        setText(request.content || "");
        sendResponse("content was displayed");
        return true;
      }
      if (request.action === "dispLLMFailure") {
        show();
        setText("failed to perform LLM Task");
        sendResponse("error message was displayed");
        return true;
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (!target.classList.contains("resizable")) {
      setIsDragging(true);
      setDragStart({
        x: event.clientX,
        y: event.clientY,
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      className={`ctrl-b-text ${
        isVisible
          ? "fixed z-50 block shadow-lg rounded-lg resizable bg-gray-800 overflow-auto"
          : "hidden"
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: "500px",
        height: "300px",
        cursor: "move",
        resize: "both",
        display: `${isVisible ? "flex" : "none"}`,
        flexDirection: "column",
      }}
    >
      <div className="flex-1 p-4">
        <textarea
          value={text}
          onChange={handleChange}
          className="w-full h-full p-4 text-gray-200 bg-gray-700 rounded-lg shadow-inner resize-none focus:outline-none"
          style={{
            minHeight: "150px",
          }}
        />
      </div>
      <div className="flex justify-between items-center px-4 py-2 bg-gray-900">
        <button
          onClick={handleCopy}
          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Copy
        </button>
        <button
          onClick={hide}
          className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Close
        </button>
      </div>
    </div>
  );
};
