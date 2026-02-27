import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, useIonRouter } from '@ionic/react';
import './About.css';

const About: React.FC = () => {
  const router = useIonRouter();

  const goToHome = () => {
    router.push('/tabs/home');
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>About Us</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="about-content">
        {/* Large title when collapsed */}
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">About Us</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Hero Section */}
        <div className="about-hero">
          <div className="hero-content">
            <h1 className="hero-title">
                Connecting Opportunities to Every Job Seeker
            </h1>
            <p className="hero-subtitle">
              JobBridge bridges the gap — making jobs accessible, 
              fast, and fair for Filipinos who need them most.
            </p>
          </div>
        </div>

        {/* Main Sections */}
        <div className="about-sections">
          {/* Who We Are */}
          <section className="about-card">
            <h2 className="section-title">Who We Are</h2>
            <p>
              JobBridge is a mobile-first platform created for the Philippines. 
              It connects everyday job seekers, especially those blocked by 
              high qualification requirements, with real opportunities from 
              small businesses, local employers, and larger companies. Whether 
              you're in Quezon City or anywhere in the country, we help turn 
              the daily struggle for stable work into real possibilities.
            </p>
          </section>

          {/* Our Mission */}
          <section className="about-card">
            <h2 className="section-title">Our Mission</h2>
            <p>
              In a country where strict requirements and skills mismatches leave 
              many talented Filipinos unemployed or underemployed, we exist to 
              lower those barriers. JobBridge provides fast, simple access to 
              entry-level, semi-skilled, and fair-wage jobs, even when salaries 
              match or fall below standard rates based on the role. By empowering 
              recruiters to post quickly and applicants to apply easily, we help 
              reduce poverty, stabilize family incomes, improve mental well-being, 
              and build brighter futures for individuals and communities across 
              the Philippines.
            </p>
          </section>

          {/* What Sets Us Apart */}
          <section className="about-card highlight">
            <h2 className="section-title">What Sets Us Apart</h2>
            <p>
              • <b>Truly mobile-first</b> — apply or post jobs in 
              seconds, as simple as sending a message.<br />
              • <b>No endless forms </b>— quick profiles, one-tap applications, 
              and direct contact connections with employers.<br />
              • <b>Inclusive opportunities</b> — jobs for all levels, including 
              those without advanced degrees or certifications.<br />
              • <b>Fast & secure</b> — recruiters fill roles quicker; applicants 
              get responses without weeks of waiting.<br />
              • <b>Philippine-focused </b>— understanding local needs, 
              from urban centers to provinces, supporting both small 
              businesses and job seekers in breaking the cycle of poverty.
            </p>
          </section>

          {/* Closing / Join Today */}
          <section className="about-card">
            <h2 className="section-title">Join the Bridge Today</h2>
            <p>
              Every job connection we make is more than employment, it's hope, 
              stability, and dignity for Filipino families. JobBridge isn't just 
              an app. It's a movement to make work accessible for everyone who 
              needs it. Start your journey now, your next opportunity is just a tap away.
            </p>
          </section>
        </div>

        {/* CTA */}
        <div className="cta-wrapper">
          <button className="cta-button" onClick={goToHome}>
            Find Your Next Job →
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default About;