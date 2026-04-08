import './Features.css';

const FEATURES = [
  {
    title: 'فيديو عالي الجودة',
    description: ' فيديو عالي الدقة مع وضوح الليل قدرات رؤية للمراقبة على مدار الساعة طوال أيام الأسبوع.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M23 7l-7 5 7 5V7z" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    title: 'تنبيهات فورية',
    description: 'الإشعارات الفورية المرسلة إلى أجهزتك عند اكتشاف نشاط مشبوه.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    title: 'اكتشاف الحركة',
    description: 'الكشف عن الحركة المتقدم بقوة الذكاء الاصطناعي مع التحليل في الوقت الحقيقي والذكاء تصنيف.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    title: 'عمر بطارية طويل',
    description: 'عمر بطارية تشغيل مع طاقة ذكية الإدارة والشحن التلقائي محطة.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="2" y="7" width="18" height="10" rx="2" ry="2" />
        <line x1="20" y1="10" x2="20" y2="14" />
      </svg>
    ),
  },
  {
    title: 'تعلم الذكاء الاصطناعي',
    description: 'خوارزميات التعلم العميق التي تتكيف بينك، وتقليل الإنذارات الزائفة.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
        <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      </svg>
    ),
  },
  {
    title: 'بث مباشر عن بُعد',
    description: 'شاهد بثًا مباشرًا لما تراه الكاميرا بالضبط، في أي وقت ومن أي مكان .',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
    ),
  },
];

function Features() {
  return (
    <section className="features" dir="rtl" lang="ar" aria-labelledby="features-heading">
      <div className="features__container">
        <header className="features__header">
          <h2 id="features-heading" className="features__title">
            ميزات أمان متقدمة
          </h2>
          <p className="features__subtitle">
            حارس ذكي يجمع بين تقنيات الذكاء الاصطناعي الحديثة والأجهزة المتطورة لتقديم مراقبة متكاملة لا مثيل لها.
          </p>
        </header>
        <div className="features__grid">
          {FEATURES.map((feature, index) => (
            <article key={index} className="features__card">
              <div className="features__card-icon" aria-hidden>
                {feature.icon}
              </div>
              <h3 className="features__card-title">{feature.title}</h3>
              <p className="features__card-description">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
