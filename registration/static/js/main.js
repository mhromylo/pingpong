async function checkAuth() {
    try {
        let response = await fetch("/check-auth/");
        console.log(response);
        let data = await response.json();
        console.log(data);
        if (data.authenticated) {
            document.getElementById("auth-nav").style.display = "flex";
            document.getElementById("guest-nav").style.display = "none";
        } else {
            document.getElementById("auth-nav").style.display = "none";
            document.getElementById("guest-nav").style.display = "flex";
        }
    } catch (error) {
        console.error("Error checking authentication:", error);
    }
}
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

export function fetchNewCSRFToken() {
    fetch("/get_csrf_token/")
    .then(response => response.json())
    .then(data => {
        if (data.csrf_token) {
            document.querySelector('meta[name="csrf-token"]').setAttribute("content", data.csrf_token);
            var csrfInput = document.querySelector('#logout-form input[name="csrfmiddlewaretoken"]');
            if (csrfInput) {
                csrfInput.value = data.csrf_token;
            }
        }
    })
    .catch(error => console.error("CSRF Token Fetch Error:", error));
}


    function getCSRFToken() {
        let csrfToken = document.querySelector('input[name=csrfmiddlewaretoken]');
        if (!csrfToken) {
            csrfToken = document.cookie.split('; ')
                .find(row => row.startsWith('csrftoken='))
                ?.split('=')[1];
        }
        return csrfToken;
    }

    const container = document.getElementById("content");

    export function loadPage(url, addToHistory = true, additionalParam = null) {
        if (additionalParam) {
            const urlObj = new URL(url, window.location.origin);
            urlObj.searchParams.append('language_code', additionalParam);
            url = urlObj.toString();
        }
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
            if (url === '/game_setup/' || url === '/tournament/')
                loadMyCanvasScript();
        })
        .catch(error => console.error("Error loading page:", error));
    }

    function loadNavbar(url, additionalParam = null) {
        if (additionalParam) {
            const urlObj = new URL(url, window.location.origin);
            urlObj.searchParams.append('language_code', additionalParam);
            url = urlObj.toString();
        }
        fetch(url)
            .then(response => response.text())
            .then(html => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;

                // Extract the content from the response
                const newContent = tempDiv.querySelector('#navbarNav');
                if (newContent) {
                    document.getElementById('navbarNav').innerHTML = newContent.innerHTML;
                }

                checkAuth();
            })
            .catch(error => console.error("Error loading page:", error));
    }

    function attachFormEventListeners() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', handleFormSubmit);
        });
    }
    function handleFormSubmit(event) {
        event.preventDefault(); // Prevent default form submission
        const form = event.target;
        const formData = new FormData(form);
        const csrfToken = getCSRFToken();

        fetch(form.action, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
                'X-Requested-With': 'XMLHttpRequest', // Indicate this is an AJAX request
            },
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message); // Show success message
                    if (data.goal){
                        updatePlayerProfile(data);
                    }
                    if (data.new_display_name){
                        updateDisplayName(data);
                    }
                    if (data.redirect_url) {
                        fetchNewCSRFToken();
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
        });
    }

    function joinTournament(tournamentId) {
        fetch(`/join_tournament/${tournamentId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    updateTournamentUI(data);
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error("Error joining tournament:", error);
            });
    }
    
    function updateTournamentUI(data) {
        const playersList = document.getElementById('players-list');
        if (playersList) {
            const playerItem = document.createElement('li');
            playerItem.id = `player-${data.player_name}`;
            playerItem.innerHTML = `
                <span class="player-name">${data.player_name}</span>
                <img src="${data.player_avatar}" alt="${data.player_name}" class="avatar">
            `;
            playersList.appendChild(playerItem);
        }
    
        const playerCount = document.getElementById('player-count');
        if (playerCount) {
            playerCount.innerText = `Players: ${data.player_count}/4`;
        }
    }
        // Function to handle player login
    function loginPlayer(formId, endpoint, playerNumber) {
        const form = document.getElementById(formId);
        if (!form) return;
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            const formData = new FormData(form);
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            console.log('Form Data:', Object.fromEntries(formData));
            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formData,
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log('Response:', data);
                        alert(data.message);
                        updatePlayerProfile(playerNumber, data);
                    } else {
                        alert(data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        });
    }

    $(document).on("change", "#language-select", function () {
        let selectedLanguage = this.value;
        let csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        console.log(selectedLanguage);
        fetch("/set_language/", {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
                'X-Requested-With': 'XMLHttpRequest' // Indicate this is an AJAX request
            },
            body: new URLSearchParams({
                "language_code": selectedLanguage,
                "next": window.location.pathname
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.success) {
                loadNavbar("/layout/", selectedLanguage)
                loadPage(data.redirect_url);
            } else {
                console.error("Language change failed.");
            }
        })
        .catch(error => console.error("Error:", error));
    });
    
    // Function to update player profile UI
    function updatePlayerProfile(data) {
        let playerNumber = data.player_number;
        const avatar = document.getElementById(`player${playerNumber}-avatar`);
        if (avatar) {
            avatar.src = data[`player${playerNumber}_avatar`];
        }
        const display_name = document.getElementById(`player${playerNumber}-display-name`);
        if (display_name) {
            display_name.innerHTML = `<strong>Display Name:</strong>${data[`player${playerNumber}_display_name`]}`;
        }
        const wins = document.getElementById(`player${playerNumber}-wins`);
        if (avatar) {
            wins.innerHTML = `<strong>Wins:</strong>${data[`player${playerNumber}_wins`]}`;
        }
        const losses = document.getElementById(`player${playerNumber}-losses`);
        if (losses) {
            losses.innerHTML = `<strong>Losses:</strong>${data[`player${playerNumber}_losses`]}`;
        }
        const id = document.getElementById(`player${playerNumber}-id`);
        if (id) {
            id.innerHTML = `<strong>ID:</strong>${data[`player${playerNumber}_id`]}`;
        }
    }
    

        // Function to handle display name updates
    function updateDisplayName(data) {
        let playerNumber = data.player_number;
        const display_name = document.getElementById(`player${playerNumber}-display-name`);
        if (display_name) {
            display_name.innerHTML = `<strong>Display Name:</strong> ${data.new_display_name}`;
        }
    }

        
document.addEventListener("DOMContentLoaded", function () {

    checkAuth();
    loadPage(window.location.pathname);
    attachFormEventListeners();


    const container = document.getElementById("content");

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

 
    
});
