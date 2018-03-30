const updateButton = document.getElementById('updateButton');
updateButton.addEventListener('click', (ev) => {
  navigator.serviceWorker.ready.then((registration) => {
    const worker = registration.installing || registration.waiting;
    console.log('index: sending reload to sw');
    if( worker ) {
      worker.postMessage({action:'reload'});
    } else {
      console.info("index: no waiting/installing worker")
    }
    updateButton.classList.add('hidden');
  });
});

navigator.serviceWorker.register("./sw.js").then((registration) => {
  console.info("index: registered %o", registration);
  registration.addEventListener('updatefound' ,(ev) => {
    console.info("index: update found %o %o", registration, ev);

    const worker = registration.installing || registration.waiting;
    if( worker ) {
      worker.onstatechange = (ev) => { 
        console.info("index: statechanged %o %o", ev.target.state, ev); 
        switch(ev.target.state) {
          case 'installed':
            console.log('index: asking user to reload %o %o %o', worker, registration, navigator.serviceWorker);
            updateButton.classList.remove('hidden');
            break;
          case 'activated':
            const mustClaim = ev.target === navigator.serviceWorker.controller;
            console.log('index: activated, %o, %o %o %o', mustClaim, worker, registration, navigator.serviceWorker);
            break;
        }
      }
    }
    else
    {
      console.log("index: no worker installing or waiting");
    }
  });

  window.setInterval(() => {
     registration.update();
  }, 10*1000);
});

navigator.serviceWorker.oncontrollerchange = (ev) => {
    console.info("index: controller changed %o", ev);
    window.location.reload();
  };

