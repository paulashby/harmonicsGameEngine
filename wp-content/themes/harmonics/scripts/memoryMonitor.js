var memoryMonitor = function () {
	var div = document.createElement('div');
	div.style.cssText = 'position:absolute;top:0;right:0;background:rgba(255,255,255,0.5);padding:10px;pointer-events:none;z-index:10000;font-family:sans-serif';
	document.body.appendChild(div);
	setInterval(function () {
	    div.innerHTML = (Math.round(console.memory.usedJSHeapSize / 1024 / 1024 * 10) / 10) + ' / ' + (Math.round(console.memory.totalJSHeapSize / 1024 / 1024 * 10) / 10);
	    gc();
	}, 250);		
};
window.addEventListener("load", memoryMonitor, false); 