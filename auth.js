document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const errorMessageContainer = document.getElementById('error-message');

    // --- Authentication State Observer ---
    auth.onAuthStateChanged(user => {
        const currentPage = window.location.pathname.split("/").pop();
        
        if (user) {
            // User is signed in.
            if (currentPage === 'login.html') {
                // If user is logged in and on the login page, redirect to admin dashboard.
                window.location.href = 'admin.html';
            } else if (currentPage === 'admin.html') {
                // User is on the admin page and logged in, show the content.
                document.getElementById('loader').style.display = 'none';
                document.getElementById('app-content').style.display = 'block';
            }
        } else {
            // User is signed out.
            if (currentPage === 'admin.html') {
                // If user is not logged in and tries to access admin page, redirect to login.
                window.location.href = 'login.html';
            }
        }
    });

    // --- Login Handler ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = loginForm.email.value;
            const password = loginForm.password.value;

            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Signed in successfully, the observer will handle the redirect.
                })
                .catch((error) => {
                    console.error("Login Error:", error);
                    if (errorMessageContainer) {
                        errorMessageContainer.textContent = "Error: Invalid email or password.";
                        errorMessageContainer.style.display = 'block';
                    }
                });
        });
    }

    // --- Logout Handler ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                // Sign-out successful. The observer will redirect to login.html.
            }).catch((error) => {
                console.error("Logout Error:", error);
                alert("An error occurred while logging out.");
            });
        });
    }
});
