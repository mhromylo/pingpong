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
            headers: {'X-CSRFToken': csrftoken},
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

    const forms = document.querySelectorAll('form');

    // Attach the handler to each form
    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });


    const ws = new WebSocket('wss://127.0.0.1:8000/ws/status/');

    ws.onmessage = function (event) {
        const data = JSON.parse(event.data);
        const friendItem = document.querySelector(`.friend-name[data-username="${data.username}"]`);
        if (friendItem) {
            const statusIndicator = friendItem.nextElementSibling;
            statusIndicator.dataset.status = data.is_online ? "online" : "offline";
        }
    };


});