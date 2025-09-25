const messageListeners = new Set();

function dispatchMessage(message, sender, sendResponse) {
  let shouldKeepAlive = false;
  messageListeners.forEach((listener) => {
    try {
      const result = listener(message, sender, sendResponse);
      if (result === true) {
        shouldKeepAlive = true;
      }
    } catch (error) {
      console.error('[popup] runtime listener error', error);
    }
  });
  return shouldKeepAlive;
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(dispatchMessage);
}

export function addMessageListener(listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }
  messageListeners.add(listener);
  return () => {
    messageListeners.delete(listener);
  };
}

export function addTypedMessageListener(type, handler) {
  if (!type || typeof handler !== 'function') {
    return () => {};
  }
  const listener = (message, sender, sendResponse) => {
    if (!message || message.type !== type) {
      return false;
    }
    return handler(message, sender, sendResponse);
  };
  return addMessageListener(listener);
}

export function sendMessage(message) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    } catch (error) {
      reject(error);
    }
  });
}
