/**
 * Configuration for Interactive Areas
 * Easily tweak these values to perfectly align with the visual elements in home.PNG
 * Coordinates are based on an original image size of 1536x1024
 */
const CONFIG = {
    originalWidth: 1536,
    originalHeight: 1024,
    // Door 1 configuration (Pink House / Tech Career)
    door1: {
        left: 360,   // px from left
        top: 520,    // px from top
        width: 120,  // px width
        height: 180, // px height
        name: "Tech Career"
    },
    // Door 2 configuration (Right Mushroom House / Content Creator)
    door2: {
        left: 1140,
        top: 490,
        width: 100,
        height: 190,
        name: "Content Creator"
    },
    // Girl Profile configuration (Middle character drawn in the painting)
    girl: {
        left: 720,
        top: 600,
        width: 120,
        height: 150,
    }
};

document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const bgImage = document.getElementById('background-img');
    const door1 = document.getElementById('door1');
    const door2 = document.getElementById('door2');
    const girl = document.getElementById('girl');
    const loader = document.getElementById('loader');
    
    // Modals
    const doorModal = document.getElementById('door-modal');
    const doorTitle = document.getElementById('door-title');
    const enterBtn = document.getElementById('enter-btn');
    const cancelDoorBtn = document.getElementById('cancel-door-btn');

    let scale = 1;

    // Initialization
    function init() {
        // Remove loader after fake loading or when image loads
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 1500);

        updateLayout();
        window.addEventListener('resize', updateLayout);
        
        setupInteractions();
        initParticles();
    }

    // This function acts like "object-fit: cover" but keeps our coordinate system intact!
    function updateLayout() {
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        // Calculate scale to cover the entire screen
        const scaleX = winW / CONFIG.originalWidth;
        const scaleY = winH / CONFIG.originalHeight;
        scale = Math.max(scaleX, scaleY); // Use max for cover, min for contain

        // Calculate new dimensions
        const newW = CONFIG.originalWidth * scale;
        const newH = CONFIG.originalHeight * scale;

        // Calculate offset to center the scaled image
        const offsetX = (winW - newW) / 2;
        const offsetY = (winH - newH) / 2;

        // Apply to background image
        bgImage.style.width = `${newW}px`;
        bgImage.style.height = `${newH}px`;
        bgImage.style.left = `${offsetX}px`;
        bgImage.style.top = `${offsetY}px`;

        // Function to position invisible hitboxes over the background elements
        const positionElement = (el, conf) => {
            const elLeft = offsetX + (conf.left * scale);
            const elTop = offsetY + (conf.top * scale);
            const elWidth = conf.width * scale;
            const elHeight = conf.height * scale;

            el.style.left = `${elLeft}px`;
            el.style.top = `${elTop}px`;
            el.style.width = `${elWidth}px`;
            el.style.height = `${elHeight}px`;
        };

        positionElement(door1, CONFIG.door1);
        positionElement(door2, CONFIG.door2);
        positionElement(girl, CONFIG.girl);
    }

    // Interaction Setup
    function setupInteractions() {
        const sceneContainer = document.getElementById('scene-container');

        // Helper to remove zoom
        const closeModalsContent = () => {
             doorModal.classList.add('hidden');
             sceneContainer.classList.remove('zoomed-scene');
        };

        // Elements for video transition
        const videoOverlay = document.getElementById('video-transition-overlay');
        const transitionVideo = document.getElementById('transition-video');

        // Doors
        [door1, door2].forEach(door => {
            door.addEventListener('click', () => {
                const label = door.dataset.label;
                
                // Set the correct video source immediately
                if (door.id === 'door1') {
                    transitionVideo.src = 'o_left_door.mp4';
                } else if (door.id === 'door2') {
                    transitionVideo.src = 'o_right_door.mp4';
                }
                
                transitionVideo.load();

                // Magical click depression and scene zoom
                door.style.transform = 'scale(0.9) perspective(400px) rotateX(5deg)';
                sceneContainer.classList.add('zoomed-scene');

                // Restore dot scale quickly
                setTimeout(() => {
                    door.style.transform = 'scale(1)';
                }, 400);

                // Show the black overlay right away to mask the zoom transitioning to video
                setTimeout(() => {
                    videoOverlay.classList.remove('hidden');
                    
                    // Attempt to play it. The promise will resolve once the video is ready.
                    const playPromise = transitionVideo.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.log("Autoplay prevented or failed", error);
                            // Fallback to direct redirect if video completely fails
                            if (door.id === 'door1') window.location.href = 'tech.html';
                            else if (door.id === 'door2') window.location.href = 'content.html';
                        });
                    }

                    transitionVideo.onended = () => {
                        if (door.id === 'door1') window.location.href = 'tech.html';
                        else if (door.id === 'door2') window.location.href = 'content.html';
                    };
                }, 600); // Wait 600ms for the zoom effect, then show video
            });
        });

        cancelDoorBtn.addEventListener('click', closeModalsContent);

        enterBtn.addEventListener('click', () => {
            // Action when they click enter
            alert(`Transitioning to ${doorTitle.textContent}...`);
            closeModalsContent();
        });

        // Girl Profile
        const magicFlashOverlay = document.getElementById('magic-flash-overlay');
        
        girl.addEventListener('click', (e) => {
             // Position the flash exactly where the click happened or at the center of the girl
             const rect = girl.getBoundingClientRect();
             const centerX = rect.left + rect.width / 2;
             const centerY = rect.top + rect.height / 2;
             
             magicFlashOverlay.style.left = `${centerX}px`;
             magicFlashOverlay.style.top = `${centerY}px`;
             
             // Trigger the magical flash
             magicFlashOverlay.classList.add('flash-active');
             
             // Optional: a slight push-back on the character for impact
             girl.style.transform = 'scale(0.9) perspective(400px) rotateX(10deg)';
             
             // Redirect exactly when the flash covers the screen (around 600-800ms)
             setTimeout(() => {
                window.location.href = 'profile.html';
             }, 750);
        });

        // Close modals when clicking backdrop
        document.querySelectorAll('.modal-backdrop').forEach(bd => {
            bd.addEventListener('click', closeModalsContent);
        });
    }

    // Particle System for Leaves, Fireflies, and Birds
    function initParticles() {
        const canvas = document.getElementById('particle-canvas');
        const ctx = canvas.getContext('2d');
        let particles = [];
        let birds = [];

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Create initial particles (fireflies/dust)
        for(let i=0; i<40; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 1,
                speedX: Math.random() * 1 - 0.5,
                speedY: Math.random() * -1 - 0.5, // float up
                color: `rgba(255, 230, 150, ${Math.random() * 0.5 + 0.1})`,
                sinVal: Math.random() * Math.PI * 2
            });
        }
        
        // Create occasional birds
        setInterval(() => {
            if (Math.random() > 0.5 && birds.length < 3) {
                birds.push({
                    x: canvas.width + 50,
                    y: Math.random() * (canvas.height / 2),
                    size: Math.random() * 1.5 + 1.5,
                    speedX: Math.random() * -3 - 2,
                    speedY: Math.random() * 1 - 0.5,
                    wingState: 0
                });
            }
        }, 5000);

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Animate particles
            particles.forEach((p, index) => {
                p.x += p.speedX + Math.sin(p.sinVal) * 0.5;
                p.y += p.speedY;
                p.sinVal += 0.05;

                // Reset
                if (p.y < -10) {
                    p.y = canvas.height + 10;
                    p.x = Math.random() * canvas.width;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            });

            // Animate birds (simple V shapes)
            birds.forEach((b, index) => {
                b.x += b.speedX;
                b.y += b.speedY;
                b.wingState += 0.15;

                // Draw simple flying bird using paths
                ctx.save();
                ctx.translate(b.x, b.y);
                ctx.fillStyle = 'rgba(20, 25, 40, 0.6)';
                
                const wingY = Math.sin(b.wingState) * 4;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(b.size * 5, wingY - b.size*2, b.size * 10, wingY);
                ctx.quadraticCurveTo(b.size * 5, wingY + b.size, 0, 0);
                
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(-b.size * 5, wingY - b.size*2, -b.size * 10, wingY);
                ctx.quadraticCurveTo(-b.size * 5, wingY + b.size, 0, 0);
                
                ctx.fill();
                ctx.restore();

                if (b.x < -50) birds.splice(index, 1);
            });

            requestAnimationFrame(animate);
        }
        
        animate();
    }

    // Wait for main image to load before initializing logic to get correct size if needed
    if (bgImage.complete) {
        init();
    } else {
        bgImage.addEventListener('load', init);
    }
});
