
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

// Wrap title words in spans for individual hover effects
document.addEventListener('DOMContentLoaded', function() {
    const aboutTitle = document.querySelector('.about-main-title');
    if (aboutTitle) {
        const text = aboutTitle.innerHTML;
        const words = text.split(/(\s+|<br>)/);
        const wrappedWords = words.map(word => {
            if (word.trim() && !word.includes('<br>')) {
                return `<span class="word">${word}</span>`;
            }
            return word;
        }).join('');
        aboutTitle.innerHTML = wrappedWords;
    }
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
    
    // Title fade effect on scroll
    const aboutTitle = document.querySelector('.about-main-title');
    if (aboutTitle) {
        const titleRect = aboutTitle.getBoundingClientRect();
        const titleVisible = titleRect.bottom > 0 && titleRect.top < window.innerHeight * 0.6;
        
        if (titleVisible) {
            aboutTitle.classList.remove('fade-out');
        } else {
            aboutTitle.classList.add('fade-out');
        }
    }
    
    // About paragraphs scroll animation with visibility-based opacity
    const aboutParagraphs = document.querySelectorAll('.about-paragraph');
    
    aboutParagraphs.forEach(paragraph => {
        const rect = paragraph.getBoundingClientRect();
        const elementHeight = rect.height;
        const windowHeight = window.innerHeight;
        
        // Calculate how much of the element is visible
        let visibleHeight = 0;
        if (rect.top < windowHeight && rect.bottom > 0) {
            const visibleTop = Math.max(0, rect.top);
            const visibleBottom = Math.min(windowHeight, rect.bottom);
            visibleHeight = visibleBottom - visibleTop;
        }
        
        // Calculate visibility percentage
        const visibilityPercentage = Math.min(1, Math.max(0, visibleHeight / elementHeight));
        
        // Determine scroll direction based on element position
        const isScrollingDown = rect.top < windowHeight * 0.5;
        
        // Apply opacity based on visibility percentage
        if (visibilityPercentage > 0) {
            paragraph.classList.add('visible');
            paragraph.style.opacity = visibilityPercentage;
            
            // Fade from top when scrolling up, from bottom when scrolling down
            if (isScrollingDown) {
                paragraph.style.transform = `translateY(${30 * (1 - visibilityPercentage)}px)`;
            } else {
                paragraph.style.transform = `translateY(${-30 * (1 - visibilityPercentage)}px)`;
            }
        } else {
            paragraph.classList.remove('visible');
            paragraph.style.opacity = 0;
            paragraph.style.transform = isScrollingDown ? 'translateY(30px)' : 'translateY(-30px)';
        }
    });
    
    // About images scroll animation with visibility-based opacity - slower animation
    const aboutImages = document.querySelectorAll('.about-image');
    
    aboutImages.forEach(image => {
        const rect = image.getBoundingClientRect();
        const elementHeight = rect.height;
        const windowHeight = window.innerHeight;
        
        // Calculate how much of the element is visible
        let visibleHeight = 0;
        if (rect.top < windowHeight && rect.bottom > 0) {
            const visibleTop = Math.max(0, rect.top);
            const visibleBottom = Math.min(windowHeight, rect.bottom);
            visibleHeight = visibleBottom - visibleTop;
        }
        
        // Calculate visibility percentage
        const visibilityPercentage = Math.min(1, Math.max(0, visibleHeight / elementHeight));
        
        // Apply opacity and transform based on visibility percentage
        if (visibilityPercentage > 0) {
            image.classList.add('visible');
            image.style.opacity = visibilityPercentage;
            
            // Apply different transforms for primary and secondary images - slide from completely off-screen
            if (image.closest('.about-image-primary')) {
                image.style.transform = `translateX(${-200 * (1 - visibilityPercentage)}px)`;
            } else {
                image.style.transform = `translateX(${200 * (1 - visibilityPercentage)}px)`;
            }
        } else {
            image.classList.remove('visible');
            image.style.opacity = 0;
            if (image.closest('.about-image-primary')) {
                image.style.transform = 'translateX(-200px)';
            } else {
                image.style.transform = 'translateX(200px)';
            }
        }
    });
});
