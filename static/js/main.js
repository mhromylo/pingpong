let socket;
document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("content");

    function Navigate(page) {
        fetch("/" + page + "/")
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Responce wrong ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success && data.html) {
                    container.innerHTML = data.html;
                } else {
                    container.innerHTML = `<h2>Page not found: ${page}</h2>`;
                }
            })
            .catch(error => {
                console.error("Error fetching regidtration", error);
                container.innerHTML = `<h2>Page not found: ${page}</h2>`;
            });
    }

    function handleFormSubmit(event) {
        event.preventDefault(); // Prevent normal form submission
        const form = event.target;
        const formData = new FormData(form);
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;


        fetch(form.action, {
            method: 'POST',
            contentType: 'application/json',
            headers: {'X-CSRFToken': csrfToken},
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    container.innerHTML = `<h2>${data.message}</h2>`;
                } else if (data.errors) {
                    const errors = Object.entries(data.errors)
                        .map(([field, msgs]) => `<p><strong>${field}:</strong> ${msgs.join(', ')}</p>`)
                        .join('');
                    container.innerHTML = `<div class="alert alert-danger">${errors}</div>`;
                }
            })
            .catch(error => {
                console.error("Error submitting form", error);
            });
    }

    document.querySelectorAll("nav a").forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();

            let page = this.getAttribute("href").substring(1);

            Navigate(page);
        });
    });

    function handleDefaultFormSubmit(event) {
        const form = event.target;
        const formData = new FormData(form);
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;


        fetch(form.action, {
            method: 'POST',
            contentType: 'application/json',
            headers: {'X-CSRFToken': csrfToken},
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.reload();
                } else if (data.errors) {
                    const errors = Object.entries(data.errors)
                        .map(([field, msgs]) => `<p><strong>${field}:</strong> ${msgs.join(', ')}</p>`)
                        .join('');
                    container.innerHTML = `<div class="alert alert-danger">${errors}</div>`;
                }
            })
            .catch(error => {
                console.error("Error submitting form", error);
            });
    }

    document.addEventListener("DOMContentLoaded", function() {
        const forms = document.querySelectorAll('form');
    
        forms.forEach(function(form) {
            if (form.id !== 'logout-form') { // Check if form does not have the ID 'logout-form'
                form.addEventListener("submit", handleFormSubmit);
            }
        });
    });

    document.addEventListener("DOMContentLoaded", function() {
        const form = document.getElementById("logout-form");
        if (form) {
            form.addEventListener("submit", handleDefaultFormSubmit);
        }
    });

    socket = new WebSocket("wss://localhost/ws/socket-server/");

	socket.onopen = function(event){
		console.log("Websocket connection established,");
	};

    socket.onmessage = function(event) {
		console.log("Recived:", event.data);
     };

	socket.onerror = function(event){
		console.error("Websocket error:", event);
	};

	socket.onclose = function(event){
		console.log("Websocket connection closed.");
	};
	
	
    function updateFriendStatus(friendId, status) {
        const statusElement = document.getElementById(`status-${friendId}`);
        if (statusElement) {
            statusElement.textContent = status === "online" ? "Online" : "Offline";
            statusElement.setAttribute("data-status", status);
        }
    }

    function updateStatus(status) {
        ws.send(JSON.stringify({
            type: "status_update",
            status: status
        }));
}


});