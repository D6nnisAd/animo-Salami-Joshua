document.addEventListener('DOMContentLoaded', () => {

    // --- Fetch and Apply Global Link ---
    const globalLinkRef = db.collection('settings').doc('globalLink');
    globalLinkRef.get().then(doc => {
        if (doc.exists && doc.data().url) {
            const url = doc.data().url;
            const links = document.querySelectorAll('.js-global-link');
            links.forEach(link => {
                link.href = url;
            });
        }
    }).catch(err => console.error("Could not fetch global link:", err));


    // --- Fetch and Render Merchants (only on merchants.html) ---
    const merchantsListContainer = document.getElementById('merchants-list');
    if (merchantsListContainer) {
        const merchantsRef = db.collection('merchants');
        
        // Fetch ALL merchants first, then filter and sort on the client side.
        // This is more robust and avoids potential Firestore indexing issues.
        merchantsRef.get()
            .then(snapshot => {
                try {
                    // 1. Filter for only enabled merchants
                    const enabledMerchants = snapshot.docs
                        .map(doc => doc.data())
                        .filter(merchant => merchant.isEnabled === true);

                    if (enabledMerchants.length === 0) {
                        merchantsListContainer.innerHTML = '<p class="text-center section-text">No verified merchants are available at this time. Please check back later.</p>';
                        return;
                    }
                    
                    // 2. Sort the enabled merchants by creation date (newest first)
                    enabledMerchants.sort((a, b) => {
                        // Robustly check for a valid Firestore Timestamp object before calling .toMillis()
                        const timeA = (a.createdAt && typeof a.createdAt.toMillis === 'function') ? a.createdAt.toMillis() : 0;
                        const timeB = (b.createdAt && typeof b.createdAt.toMillis === 'function') ? b.createdAt.toMillis() : 0;
                        return timeB - timeA;
                    });

                    // 3. Render the sorted list
                    merchantsListContainer.innerHTML = ''; // Clear the loader
                    enabledMerchants.forEach(merchant => {
                        const card = document.createElement('div');
                        card.className = 'col-lg-4 col-md-6';
                        card.setAttribute('data-aos', 'fade-up');
                        
                        card.innerHTML = `
                            <div class="merchant-card">
                                <h3 class="merchant-name">${merchant.name}</h3>
                                <div class="verified-badge">
                                    <i class="fas fa-check-circle"></i> Verified Merchant
                                </div>
                                <a href="${merchant.contactLink}" target="_blank" class="btn btn-gradient w-100">Get Key</a>
                            </div>
                        `;
                        merchantsListContainer.appendChild(card);
                    });
                } catch (error) {
                     console.error("Error processing merchant data:", error);
                     merchantsListContainer.innerHTML = '<p class="text-center section-text text-danger">An error occurred while displaying merchants. Please try again later.</p>';
                }
            })
            .catch(err => {
                console.error("Error fetching merchants:", err);
                merchantsListContainer.innerHTML = '<p class="text-center section-text text-danger">Could not load merchants. Please try again later.</p>';
            });
    }

});