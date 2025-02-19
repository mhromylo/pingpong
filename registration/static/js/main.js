async function checkAuth() {
    try {
        let response = await fetch("/check-auth/");
        console.log(response);
        let data = await response.json();
        console.log(data);
        if (data.authenticated) {
            document.getElementById("auth-nav").style.display = "block";
            document.getElementById("guest-nav").style.display = "none";
        } else {
            document.getElementById("auth-nav").style.display = "none";
            document.getElementById("guest-nav").style.display = "block";
        }
    } catch (error) {
        console.error("Error checking authentication:", error);
    }
}

document.addEventListener("DOMContentLoaded", function () {

    checkAuth();

    function getCSRFToken() {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfToken ? csrfToken.value : '';
    }

    const container = document.getElementById("content");

    function loadPage(url, addToHistory = true) {
        fetch(url)
            .then(response => response.text())
            .then(html => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;

                // Extract the content from the response
                const newContent = tempDiv.querySelector('#content');
                if (newContent) {
                    document.getElementById('content').innerHTML = newContent.innerHTML;
                }

                // Reattach event listeners for forms after loading new content
                attachFormEventListeners();
                checkAuth();
                
                // Add to browser history
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
        if (event.state && event.state.path) {
            loadPage(event.state.path, false);
        }
    });

    function handleFormSubmit(event) {
        event.preventDefault(); // Prevent default form submission
        const form = event.target;
        const formData = new FormData(form);
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        fetch(form.action, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
                'X-Requested-With': 'XMLHttpRequest' // Indicate this is an AJAX request
            },
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message); // Show success message
                    if (data.redirect_url) {
                        loadPage(data.redirect_url); // Dynamically load the login page
                    }
                } else {
                    // Display form errors
                    const errorMessage = data.message || 'There was an error, please try again later.';
                    alert(errorMessage);

                    // Optionally, display form errors in the UI
                    if (data.errors) {
                        const errorContainer = document.createElement('div');
                        errorContainer.className = 'alert alert-danger';
                        for (const [field, errors] of Object.entries(data.errors)) {
                            errors.forEach(error => {
                                errorContainer.innerHTML += `<p>${field}: ${error}</p>`;
                            });
                        }
                        form.prepend(errorContainer);
                    }
                }
            })
            .catch(error => {
                console.error("Error submitting form", error);
                alert('An error occurred while processing the request.');
            });
    }

    function attachFormEventListeners() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', handleFormSubmit);
        });
    }
    
    document.querySelectorAll('form').forEach(form => {
        if (form.id === 'logout-form') {
            form.addEventListener("submit", function (event) {
                handleFormSubmit(event, true);
            });
        } else {
            form.addEventListener("submit", handleFormSubmit);
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
    loadPage(window.location.pathname);
});