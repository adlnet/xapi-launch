(function(){

	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = 'https://cdn.jsdelivr.net/async/2.1.4/async.min.js';    

	document.getElementsByTagName('head')[0].appendChild(script);

	var popup = null;
	function openFrame(cb)
	{
		popup = window.open("http://localhost:4000/utils/signStatementService","signStatement","menubar=no,status=no,titlebar=no,toolbar=no")
		ready = cb;
		
	}

	var cbs = {};
	var count = 0;
	var ready = null;

	window.addEventListener('message',function(event) {
        if(event.data.message == "statementSigned")
        {
            cbs[event.data.id](null,event.data.statement,event.data.signature);
            delete cbs[event.data.message.id];
        }
        //wait for the child window to signal ready
        if(event.data.message == "ready")
        {
        	if(ready)
        	{
        		var t= ready;
        		ready = null;
        		t();
        	}
        }
    },false);

	window.signStatement = function(statement,signedCB)
	{
		async.series([
			function openWindow(cb)
			{
				//if there is not popup
				if(!popup || popup.closed)
				{
					//open the frame then call this function again
					return openFrame(function()
					{
						return signStatement(statement,signedCB)
					});
				}
				//if the popup is not ready, but it exists
				else if(ready)
				{
					//call this again in a bit
					return window.setTimeout(function(){
						return signStatement(statement,signedCB)
					},1000)
					
				}
				else //the popup exists and is ready
					cb()
			},
			function sendMessage(cb)
			{
				
				cbs[count] = signedCB;
				popup.postMessage({
			        message:"signStatement",
			        statement:statement,
			        id:count++
			    },"*")
			    cb();
			}
		])
	}
})()