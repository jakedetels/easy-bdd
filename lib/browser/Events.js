var Events = {};

Events.listeners = {};

Events.attachListeners = function(listeners) {
  var eventName, listener;
  for (eventName in listeners) {
    listener = listeners[eventName];
    eventName = eventName.toLowerCase();
    if (typeof listener !== 'function') { continue; }
    Events.listeners[eventName] = Events.listeners[eventName] || [];
    Events.listeners[eventName].push( listener );  
  }
};

Events.trigger = function(eventName, data) {
  var listeners = this.listeners[eventName.toLowerCase()] || [];
  for (var i = 0; i < listeners.length; i++) {
    try {
      listeners[i](data);  
    } catch(e) {
      console.error('An error occurred in the "' + eventName + '" event listener. Received error: ', e);
    }
    
  }
};

export default Events;