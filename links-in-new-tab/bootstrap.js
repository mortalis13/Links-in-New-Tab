const { classes: Cc, interfaces: Ci, utils: Cu } = Components;
Cu.import('resource://gre/modules/Services.jsm');

var button, menuItem, menuBottom;
var isChecked = false;
var browserWindow = null;

function loadIntoWindow(window) {
  browserWindow = window
  
  menuItem = window.NativeWindow.menu.add({
    name:"Links in New Tab",
    checkable: true,
    callback:function(){
      toggleLinksInNewTab(window);
    }
  });
}

function toggleLinksInNewTab(window){
  if(window.BrowserApp.deck) {
    isChecked = !isChecked;
    
    window.NativeWindow.menu.update(menuItem, {
      checked: isChecked
    })
    
    if(isChecked){
      window.BrowserApp.deck.addEventListener("DOMContentLoaded", onPageLoad, false);
      addLinkEvent(window)
      window.NativeWindow.toast.show("On: Links in New Tab", "short");
    }
    else{
      window.BrowserApp.deck.removeEventListener("DOMContentLoaded", onPageLoad, false);
      removeLinkEvent(window)
      window.NativeWindow.toast.show("Off: Links in New Tab", "short");
    }
  }
}

function documentPressLink(e){
  if(e.target.tagName && e.target.tagName.toLowerCase() == 'a'){
    var href = e.target.href
    var target = e.target.getAttribute('target')
    
    if(target != '_blank'){
      if(!browserWindow) return
      browserWindow.BrowserApp.addTab(href)
      // window.BrowserApp.addTab(url, { selected: true, parentId: window.BrowserApp.selectedTab.id });
    }
  }
}

// function documentPressLink(e){
//   if(e.target.tagName && e.target.tagName.toLowerCase() == 'a'){
//     var href = e.target.getAttribute('href')
//     var target = e.target.getAttribute('target')
//     if(target != '_blank')
//       e.target.setAttribute('target', '_blank')
//   }
// }

function checkWindow(window){
  if(!window) return false
  var doc = window.document
  
  if(!doc instanceof window.HTMLDocument)
    return false
  if(!doc.body.children || !doc.body.children.length)
    return false
  
  return true
}

function addLinkEvent(window){
  var tabs = window.BrowserApp.tabs
  if(!tabs.length) return
    
  for(var i=0; i<tabs.length; i++){
    var win = tabs[i].window
    if(!checkWindow(win)) 
      continue
    win.addEventListener("mousedown", documentPressLink, false)
    
    // win.addEventListener("touchstart", function(e){
    //   win.console.log('touchstart')
    // }, false)
  }
}

function removeLinkEvent(window){
  var tabs = window.BrowserApp.tabs
  if(!tabs.length) return
    
  for(var i=0; i<tabs.length; i++){
    var win = tabs[i].window
    if(!checkWindow(win)) 
      continue
    win.removeEventListener("mousedown", documentPressLink, false)
  }
}

function onPageLoad(e){
  var gwin = e.currentTarget.ownerDocument.defaultView
  // var win = e.originalTarget.defaultView
  addLinkEvent(gwin)
}

function unloadFromWindow(window) {
  if (!window) return;
  window.NativeWindow.menu.remove(menuItem);
}


// ----------------------------------------- startup -----------------------------------------

var windowListener = {
  onOpenWindow: function(aWindow) {
    let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
    domWindow.addEventListener("UIReady", function onLoad() {
      domWindow.removeEventListener("UIReady", onLoad, false);
      loadIntoWindow(domWindow);
    }, false);
  },
 
  onCloseWindow: function(aWindow) {},
  onWindowTitleChange: function(aWindow, aTitle) {}
};

function startup(aData, aReason) {
  let windows = Services.wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    loadIntoWindow(domWindow);
  }
  Services.wm.addListener(windowListener);
}

function shutdown(aData, aReason) {
  if (aReason == APP_SHUTDOWN) return;
  Services.wm.removeListener(windowListener);
  let windows = Services.wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    unloadFromWindow(domWindow);
  }
}
