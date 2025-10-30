document.addEventListener('DOMContentLoaded', () => {
    // --- Page Containers ---
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');

    // --- Login Elements ---
    const loginForm = document.getElementById('login-form');
    const errorMessageContainer = document.getElementById('error-message');

    // --- Dashboard Elements ---
    const logoutBtn = document.getElementById('logout-btn');

    let dashboardInitialized = false;

    // --- Authentication State Observer ---
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in. Show dashboard, hide login.
            loginContainer.style.display = 'none';
            dashboardContainer.style.display = 'block';
            
            // Initialize dashboard logic only once
            if (!dashboardInitialized) {
                initializeDashboard();
                dashboardInitialized = true;
            }
        } else {
            // User is signed out. Show login, hide dashboard.
            dashboardContainer.style.display = 'none';
            loginContainer.style.display = 'flex';
        }
    });

    // --- Login Handler ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = loginForm.email.value;
        const password = loginForm.password.value;

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Signed in successfully, the observer will handle showing the dashboard.
                errorMessageContainer.style.display = 'none';
            })
            .catch((error) => {
                console.error("Login Error:", error);
                errorMessageContainer.textContent = "Error: Invalid email or password.";
                errorMessageContainer.style.display = 'block';
            });
    });

    // --- Logout Handler ---
    logoutBtn.addEventListener('click', () => {
        auth.signOut().catch((error) => {
            console.error("Logout Error:", error);
            alert("An error occurred while logging out.");
        });
    });
});


function initializeDashboard() {
    // --- Globals ---
    const globalLinkForm = document.getElementById('global-link-form');
    const globalLinkInput = document.getElementById('global-link-input');
    const merchantsListAdminContainer = document.getElementById('merchants-list-admin');
    const addMerchantForm = document.getElementById('add-merchant-form');
    const editMerchantForm = document.getElementById('edit-merchant-form');
    const editMerchantModalEl = document.getElementById('editMerchantModal');
    const editMerchantModal = new bootstrap.Modal(editMerchantModalEl);
    const addMerchantModal = new bootstrap.Modal(document.getElementById('addMerchantModal'));
    
    const appToast = new bootstrap.Toast(document.getElementById('appToast'));
    const toastTitle = document.getElementById('toast-title');
    const toastBody = document.getElementById('toast-body');

    // --- Toast Notifier ---
    function showToast(title, message, isError = false) {
        toastTitle.textContent = title;
        toastBody.textContent = message;
        const toastEl = document.getElementById('appToast');
        if(isError) {
             toastEl.classList.add('bg-danger', 'text-white');
             toastEl.classList.remove('bg-success');
        } else {
             toastEl.classList.remove('bg-danger');
             toastEl.classList.add('bg-success', 'text-white');
        }
        appToast.show();
    }


    // --- Global Link Logic ---
    const globalLinkRef = db.collection('settings').doc('globalLink');

    // Fetch and display the current global link
    globalLinkRef.get().then(doc => {
        if (doc.exists) {
            globalLinkInput.value = doc.data().url || '';
        }
    }).catch(err => console.error("Error fetching global link: ", err));

    // Handle form submission to update the global link
    globalLinkForm.addEventListener('submit', e => {
        e.preventDefault();
        const newUrl = globalLinkInput.value.trim();
        if (newUrl) {
            globalLinkRef.set({ url: newUrl })
                .then(() => showToast('Success', 'Global link updated successfully!'))
                .catch(err => showToast('Error', 'Failed to update global link.', true));
        }
    });


    // --- Merchant Logic ---
    const merchantsRef = db.collection('merchants');

    // Fetch and display merchants in real-time
    merchantsRef.orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        merchantsListAdminContainer.innerHTML = ''; // Clear existing content
        if (snapshot.empty) {
            merchantsListAdminContainer.innerHTML = '<div class="col-12 text-center"><p class="text-white-50">No merchants found. Add one to get started!</p></div>';
            return;
        }
        snapshot.forEach(doc => {
            const merchant = doc.data();
            const merchantId = doc.id;
            
            const cardCol = document.createElement('div');
            cardCol.className = 'col-lg-6 col-md-12';
            
            cardCol.innerHTML = `
                <div class="merchant-card-admin">
                    <h6>${merchant.name}</h6>
                    <a href="${merchant.contactLink}" target="_blank" rel="noopener noreferrer">${merchant.contactLink}</a>
                    <div class="merchant-card-footer">
                        <div class="status-group">
                            <div class="form-check form-switch">
                                <input class="form-check-input status-toggle" type="checkbox" role="switch" id="status-toggle-${merchantId}" ${merchant.isEnabled ? 'checked' : ''}>
                            </div>
                            <span class="status-text">${merchant.isEnabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <div class="actions">
                            <button class="btn action-btn edit" title="Edit"><i class="fas fa-pencil-alt"></i></button>
                            <button class="btn action-btn delete" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add event listeners for the new card's elements
            const statusToggle = cardCol.querySelector('.status-toggle');
            const statusText = cardCol.querySelector('.status-text');
            statusToggle.addEventListener('change', () => {
                const newStatus = statusToggle.checked;
                merchantsRef.doc(merchantId).update({ isEnabled: newStatus })
                    .then(() => {
                        statusText.textContent = newStatus ? 'Enabled' : 'Disabled';
                        showToast('Success', `Merchant status updated.`);
                    })
                    .catch(err => {
                        // Revert toggle on failure if there's an error
                        statusToggle.checked = !newStatus;
                        showToast('Error', 'Failed to update merchant status.', true);
                    });
            });

            const editBtn = cardCol.querySelector('.edit');
            editBtn.addEventListener('click', () => {
                document.getElementById('edit-merchant-id').value = merchantId;
                document.getElementById('edit-merchant-name').value = merchant.name;
                document.getElementById('edit-merchant-link').value = merchant.contactLink;
                editMerchantModal.show();
            });

            const deleteBtn = cardCol.querySelector('.delete');
            deleteBtn.addEventListener('click', () => {
                if (confirm(`Are you sure you want to delete merchant "${merchant.name}"?`)) {
                    merchantsRef.doc(merchantId).delete()
                    .then(() => showToast('Success', 'Merchant deleted.'))
                    .catch(err => showToast('Error', 'Failed to delete merchant.', true));
                }
            });

            merchantsListAdminContainer.appendChild(cardCol);
        });
    });

    // Handle "Add Merchant" form submission
    addMerchantForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('new-merchant-name').value.trim();
        const link = document.getElementById('new-merchant-link').value.trim();

        if (name && link) {
            merchantsRef.add({
                name: name,
                contactLink: link,
                isEnabled: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                showToast('Success', 'New merchant added successfully!');
                addMerchantForm.reset();
                addMerchantModal.hide();
            })
            .catch(err => showToast('Error', 'Failed to add merchant.', true));
        }
    });
    
    // Handle "Edit Merchant" form submission
    editMerchantForm.addEventListener('submit', e => {
        e.preventDefault();
        const id = document.getElementById('edit-merchant-id').value;
        const name = document.getElementById('edit-merchant-name').value.trim();
        const link = document.getElementById('edit-merchant-link').value.trim();
        
        if (id && name && link) {
             merchantsRef.doc(id).update({
                name: name,
                contactLink: link
            })
            .then(() => {
                showToast('Success', 'Merchant details updated!');
                editMerchantModal.hide();
            })
            .catch(err => showToast('Error', 'Failed to update merchant.', true));
        }
    });
}