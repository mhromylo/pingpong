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
    attachFormEventListeners();
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
        const formData = new FormData(form); // Use FormData to handle form data
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
        fetch(form.action, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
                'X-Requested-With': 'XMLHttpRequest' // Indicate this is an AJAX request
            },
            body: formData // Send FormData directly
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message); // Show success message
    
                    // Update the tournament info dynamically
                    const tournamentInfo = document.getElementById('tournament-info');
                    if (tournamentInfo) {
                        tournamentInfo.innerHTML = `
                            <h3>Tournament: ${data.tournament_name}</h3>
                            <p><strong>Creator:</strong> ${data.creator}</p>
                            <p><strong>Players:</strong> ${data.player_count}</p>
                            <p><strong>Avatar:</strong> <img src="${data.player1_avatar}" alt="Player Avatar" class="avatar"></p>
                            <a href="/tournament/${data.tournament_id}/">View Tournament</a>
                        `;
                        tournamentInfo.style.display = 'block';
                    }
    
                    // Optionally, redirect to the tournament page
                    if (data.redirect_url) {
                        loadPage(data.redirect_url); // Dynamically load the tournament page
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
                alert('An error occurred while joining the tournament.');
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
    function loginPlayer(formId, endpoint, playerNumber) {
        const form = document.getElementById(formId);
        if (!form) return;
    
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            const formData = new FormData(form);
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
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
                        alert(data.message);
                        updatePlayerProfile(playerNumber, data);
                    } else {
                        alert(data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred while processing the request.');
                });
        });
    }
    
    // Function to update the player profile UI
    function updatePlayerProfile(playerNumber, data) {
        const profileElement = document.getElementById(`player${playerNumber}-profile`);
        if (profileElement) {
            profileElement.innerHTML = `
                <h5 class="card-title">Player ${playerNumber}</h5>
                <img id="player${playerNumber}-avatar" src="${data[`player${playerNumber}_avatar`]}" alt="Player ${playerNumber} Avatar" class="avatar rounded-circle mb-3" width="100" height="100">
                <p id="player${playerNumber}-display-name"><strong>Display Name:</strong> ${data[`player${playerNumber}_display_name`]}</p>
                <p id="player${playerNumber}-wins"><strong>Wins:</strong> ${data[`player${playerNumber}_wins`]}</p>
                <p id="player${playerNumber}-losses"><strong>Losses:</strong> ${data[`player${playerNumber}_losses`]}</p>
                <p id="player${playerNumber}-id"><strong>ID:</strong> ${data[`player${playerNumber}_id`]}</p>
            `;
        }
    }
    
    // Attach login handlers for players 2, 3, and 4
    loginPlayer('second-player-form', '/second_player_tournament/', 2);
    loginPlayer('third-player-form', '/third_player_tournament/', 3);
    loginPlayer('forth-player-form', '/forth_player_tournament/', 4);

    function updateDisplayName(formId, endpoint, playerNumber) {
        const form = document.getElementById(formId);
        if (!form) return;
    
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            const formData = new FormData(form);
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
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
                        alert(data.message);
                        const displayNameElement = document.getElementById(`player${playerNumber}-display-name`);
                        if (displayNameElement) {
                            displayNameElement.innerHTML = `<strong>Display Name:</strong> ${data.new_display_name}`;
                        }
                    } else {
                        alert(data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred while processing the request.');
                });
        });
    }
    
    // Attach update display name handlers for players 1, 2, 3, and 4
    updateDisplayName('update-tournament-name', '/tournament_name_user/1/', 1);
    updateDisplayName('update-tournament-name-user2', '/tournament_name_user/2/', 2);
    updateDisplayName('update-tournament-name-user3', '/tournament_name_user/3/', 3);
    updateDisplayName('update-tournament-name-user4', '/tournament_name_user/4/', 4);
});