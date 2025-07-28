
// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    // Handle navigation clicks
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all nav links and sections
            navLinks.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked nav link
            this.classList.add('active');
            
            // Show corresponding section
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
    
    // Handle internal content links (like street photographer -> gallery)
    const contentLinks = document.querySelectorAll('.content-link[href^="#"]');
    contentLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#gallery') {
                e.preventDefault();
                
                // Remove active class from all nav links and sections
                navLinks.forEach(nav => nav.classList.remove('active'));
                sections.forEach(section => section.classList.remove('active'));
                
                // Activate gallery nav link and section
                const galleryNavLink = document.querySelector('.nav-link[href="#gallery"]');
                const gallerySection = document.getElementById('gallery');
                
                if (galleryNavLink && gallerySection) {
                    galleryNavLink.classList.add('active');
                    gallerySection.classList.add('active');
                }
            }
        });
    });
    
    // Handle footer contact link
    const footerContactLink = document.querySelector('.footer-link[href="#contact"]');
    if (footerContactLink) {
        footerContactLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all nav links and sections
            navLinks.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // Activate contact nav link and section
            const contactNavLink = document.querySelector('.nav-link[href="#contact"]');
            const contactSection = document.getElementById('contact');
            
            if (contactNavLink && contactSection) {
                contactNavLink.classList.add('active');
                contactSection.classList.add('active');
            }
        });
    }
    
    
    
    // Lightbox functionality
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const lightboxCounter = document.getElementById('lightbox-counter');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    let currentImageIndex = 0;
    const totalImages = galleryItems.length;
    
    // Open lightbox when gallery item is clicked
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', function() {
            currentImageIndex = index;
            openLightbox();
        });
    });
    
    function openLightbox() {
        lightbox.classList.add('active');
        updateLightboxImage();
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = ''; // Restore background scrolling
    }
    
    function updateLightboxImage(direction = null) {
        const currentItem = galleryItems[currentImageIndex];
        const img = currentItem.querySelector('.placeholder-image');
        
        // Add loading shimmer effect
        lightboxImage.classList.add('lightbox-loading');
        
        // Create new image content
        let newContent;
        if (img.tagName === 'IMG') {
            newContent = `<img src="${img.src}" alt="${img.alt}" class="lightbox-image">`;
        } else {
            newContent = img.textContent;
        }
        
        // Apply slide-in animation based on direction
        if (direction) {
            const slideInClass = direction === 'next' ? 'slide-in-right' : 'slide-in-left';
            
            // Start with image off-screen
            lightboxImage.innerHTML = newContent;
            const newImage = lightboxImage.querySelector('.lightbox-image') || lightboxImage;
            newImage.classList.add(slideInClass);
            
            // Remove loading shimmer
            lightboxImage.classList.remove('lightbox-loading');
            
            // Trigger slide-in animation after a brief delay
            requestAnimationFrame(() => {
                newImage.classList.remove(slideInClass);
                newImage.classList.add('slide-in-center');
                
                // Clean up animation classes after transition
                setTimeout(() => {
                    newImage.classList.remove('slide-in-center');
                }, 500);
            });
        } else {
            // Initial load without animation
            lightboxImage.innerHTML = newContent;
            lightboxImage.classList.remove('lightbox-loading');
        }
        
        lightboxCounter.textContent = `${currentImageIndex + 1} / ${totalImages}`;
    }
    
    function showPrevImage() {
        // Animate current image out to the right
        const currentImage = lightboxImage.querySelector('.lightbox-image') || lightboxImage;
        currentImage.classList.add('slide-out-right');
        
        // Update index and load new image after animation starts
        setTimeout(() => {
            currentImageIndex = (currentImageIndex - 1 + totalImages) % totalImages;
            updateLightboxImage('prev');
        }, 150);
    }
    
    function showNextImage() {
        // Animate current image out to the left
        const currentImage = lightboxImage.querySelector('.lightbox-image') || lightboxImage;
        currentImage.classList.add('slide-out-left');
        
        // Update index and load new image after animation starts
        setTimeout(() => {
            currentImageIndex = (currentImageIndex + 1) % totalImages;
            updateLightboxImage('next');
        }, 150);
    }
    
    // Event listeners for lightbox controls
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', showPrevImage);
    lightboxNext.addEventListener('click', showNextImage);
    
    // Close lightbox when clicking outside the image
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (!lightbox.classList.contains('active')) return;
        
        switch(e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                showPrevImage();
                break;
            case 'ArrowRight':
                showNextImage();
                break;
        }
    });
    
    // Smooth scrolling for better user experience
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#') && href.length > 1) {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
});

// Add some interactive effects
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = '#fff';
        header.style.backdropFilter = 'none';
    }
    
    // About images scroll animation
    const aboutSection = document.getElementById('about');
    const primaryImage = document.querySelector('.about-image-primary');
    const secondaryImage = document.querySelector('.about-image-secondary');
    
    if (aboutSection && aboutSection.classList.contains('active') && primaryImage && secondaryImage) {
        const scrollProgress = Math.min(window.scrollY / 500, 1);
        
        // Animate primary image from left
        const primaryTranslateX = Math.max(0, 100 - (scrollProgress * 120));
        primaryImage.style.transform = `translateX(-${primaryTranslateX}px)`;
        
        // Animate secondary image from right
        const secondaryTranslateX = Math.max(0, 100 - (scrollProgress * 120));
        secondaryImage.style.transform = `translateX(${secondaryTranslateX}px)`;
        
        // Add subtle rotation based on scroll
        const rotation = scrollProgress * 2;
        primaryImage.style.transform += ` rotate(${rotation}deg)`;
        secondaryImage.style.transform += ` rotate(-${rotation}deg)`;
    }
});
