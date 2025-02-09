document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("content");

    function loadPage(url, addToHistory = true) {
        fetch(url)
            .then(response => response.text())
            .then(html => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;

                const newContent = tempDiv.querySelector('#content');
    
                if (newContent) {
                    container.innerHTML = newContent.innerHTML;
                }

                if (url === '/game_setup')
                    loadMyCanvasScript();
    
                if (addToHistory) {
                    history.pushState({ path: url }, "", url);
                }
            })
            .catch(error => console.error("Error loading page:", error));
    }
    

    document.querySelectorAll("a.nav-link").forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            const url = this.getAttribute("href").replace("#", ""); // Remove #
            loadPage(url);
        });
    });

    window.addEventListener("popstate", function (event) {
        if (event.state) {
            loadPage(event.state.path, false);
        }
    });

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

    // const ws = new WebSocket('wss://localhost/ws/status/');

    // ws.onmessage = function(event) {
    //     const data = JSON.parse(event.data);
    //     if (data.type === "friend_status") {
    //         const friendId = data.user_id;
    //         const status = data.status;
    //         updateFriendStatus(friendId, status); // Update the UI for the friend
    //     }
    // };

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


function loadMyCanvasScript() {
    var existingScript = document.querySelector('script[src="/static/js/myCanvas.js"]');
    if (existingScript) {
        existingScript.remove();
    }
    var script = document.createElement('script');
    script.type = 'module';
    script.src = "/static/js/myCanvas.js";
    script.onload = function() {};
    document.head.appendChild(script);
}
