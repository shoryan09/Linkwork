import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";

interface Feature {
  id: number;
  title: string;
  icon: string;
  description: string;
  details: string[];
}

const features: Feature[] = [
  {
    id: 1,
    title: "Dual User Authentication System",
    icon: "🔐",
    description: "Firebase-powered authentication with email/password login",
    details: [
      "Firebase-powered authentication with email/password login",
      "Separate dashboards for freelancers and clients",
      "Role-based access control (freelancer, client, or both)",
      "Secure user profile management with JWT tokens",
      "Users can sign up as either service providers or service seekers"
    ]
  },
  {
    id: 2,
    title: "Project Marketplace",
    icon: "💼",
    description: "Browse and search projects posted by clients",
    details: [
      "Browse and search projects posted by clients",
      "Filter projects by location, skills, and budget",
      "Detailed project listings showing title, description, and budget range",
      "Required skills with tags and location information",
      "Real-time project updates and proposal counts",
      "Project cards with responsive design"
    ]
  },
  {
    id: 3,
    title: "Gigs Platform",
    icon: "⭐",
    description: "Freelancers can create service offerings (gigs)",
    details: [
      "Freelancers can create service offerings (gigs)",
      "Browse available freelancer services",
      "Categorized gig listings",
      "Pricing tiers and service packages",
      "Portfolio showcasing capabilities"
    ]
  },
  {
    id: 4,
    title: "Dark Mode Support",
    icon: "🌙",
    description: "Full dark theme across entire application",
    details: [
      "Full dark theme across entire application",
      "Toggle between light and dark mode with navbar button",
      "Persistent theme preference stored in localStorage",
      "Smooth color transitions",
      "Optimized contrast for better readability",
      "Works on all pages: home, projects, gigs, dashboards, auth pages"
    ]
  },
  {
    id: 5,
    title: "Real-time Communication & Notifications",
    icon: "💬",
    description: "Socket.IO integration for real-time features",
    details: [
      "Socket.IO integration for real-time features",
      "Instant messaging between freelancers and clients",
      "Live notification system for new project postings",
      "Proposal updates and message alerts",
      "Payment confirmations",
      "Real-time chat with file attachments"
    ]
  }
];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(1); // Start at 1 because we duplicate first card
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Create infinite loop by duplicating cards
  const infiniteFeatures = [features[features.length - 1], ...features, features[0]];

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Auto-advance carousel every 2.5 seconds
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        // If we're at the last real card (index = features.length), jump to duplicate at start
        if (next >= features.length + 1) {
          return 1; // Jump to first real card (duplicate is at 0)
        }
        return next;
      });
    }, 2500);

    return () => {
      window.removeEventListener("resize", checkMobile);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle infinite loop transitions
  useEffect(() => {
    if (carouselRef.current && !isTransitioning) {
      // If we're at the duplicate at the end, jump to the real first card
      if (currentIndex === features.length + 1) {
        setIsTransitioning(true);
        setTimeout(() => {
          if (carouselRef.current) {
            carouselRef.current.style.transition = "none";
            setCurrentIndex(1);
            setTimeout(() => {
              if (carouselRef.current) {
                carouselRef.current.style.transition = "transform 500ms ease-in-out";
                setIsTransitioning(false);
              }
            }, 50);
          }
        }, 500);
      }
      // If we're at the duplicate at the start, jump to the real last card
      else if (currentIndex === 0) {
        setIsTransitioning(true);
        setTimeout(() => {
          if (carouselRef.current) {
            carouselRef.current.style.transition = "none";
            setCurrentIndex(features.length);
            setTimeout(() => {
              if (carouselRef.current) {
                carouselRef.current.style.transition = "transform 500ms ease-in-out";
                setIsTransitioning(false);
              }
            }, 50);
          }
        }, 500);
      }
    }
  }, [currentIndex, isTransitioning]);

  const handleCardClick = (feature: Feature) => {
    setSelectedFeature(feature);
    // Pause carousel when modal is open
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const closeModal = () => {
    setSelectedFeature(null);
    // Resume carousel
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= features.length + 1) {
          return 1;
        }
        return next;
      });
    }, 2500);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index + 1); // +1 because we have duplicate at start
    // Reset interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= features.length + 1) {
          return 1;
        }
        return next;
      });
    }, 2500);
  };

  const handleFindWork = () => {
    if (!user) {
      router.push("/login");
    } else {
      router.push("/dashboard/freelancer");
    }
  };

  const handleHireTalent = () => {
    if (!user) {
      router.push("/login");
    } else {
      router.push("/dashboard/client");
    }
  };

  return (
    <Layout>
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white py-20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Bridging Local Talent with Opportunity
          </h1>
          <p className="text-xl mb-8">
            Find projects, hire freelancers, and grow your business
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleFindWork}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white hover:scale-105 transition-all duration-300 transform cursor-pointer"
            >
              Find Work
            </button>
            <button
              onClick={handleHireTalent}
              className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 hover:scale-105 transition-all duration-300 transform cursor-pointer"
            >
              Hire Talent
            </button>
          </div>
        </div>
      </div>

      {/* Features Carousel Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold mb-12 text-center text-gray-900 dark:text-white">
          Platform Features
        </h2>
        
        {/* Carousel Container - Infinite loop, shows 3 cards on desktop, 1 on mobile */}
        <div className="relative overflow-hidden">
          <div 
            ref={carouselRef}
            className="flex transition-transform duration-500 ease-in-out"
            style={{ 
              transform: `translateX(-${currentIndex * (isMobile ? 100 : 100 / 3)}%)` 
            }}
          >
            {infiniteFeatures.map((feature, index) => (
              <div
                key={`${feature.id}-${index}`}
                className="min-w-full md:min-w-[33.333%] px-4"
              >
                <div
                  onClick={() => handleCardClick(feature)}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-gray-200 dark:border-gray-700 h-full"
                >
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-4xl">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {features.map((_, index) => {
            // Map currentIndex to actual feature index (accounting for duplicate at start)
            const actualIndex = currentIndex === 0 ? features.length - 1 : 
                               currentIndex === features.length + 1 ? 0 : 
                               currentIndex - 1;
            return (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-3 rounded-full transition-all duration-300 ${
                  index === actualIndex
                    ? "w-8 bg-blue-600 dark:bg-blue-500"
                    : "w-3 bg-gray-300 dark:bg-gray-600"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            );
          })}
        </div>
      </div>

      {/* Modal for Feature Details */}
      {selectedFeature && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-8 transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-3xl">
                  {selectedFeature.icon}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {selectedFeature.title}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              {selectedFeature.details.map((detail, index) => (
                <div key={index} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-700 dark:text-gray-300">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
