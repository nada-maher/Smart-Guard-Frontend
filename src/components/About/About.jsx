import './About.css';
import illustrationImage from '../../assets/images/camera2.jpeg';

const TAGS = [
  'Real-time Processing',
  'HD Cameras',
  'Computer Vision',
];

function About() {
  return (
    <section className="about" dir="rtl" lang="ar" aria-labelledby="about-heading">
      <div className="about__container">
        
        <div className="about__content">
          <h2 id="about-heading" className="about__title">
            حول نظام الأمان الذكي
          </h2>

          <div className="about__block">
            <h3 className="about__subheading">هدف المشروع</h3>
            <p className="about__description">
              مهمتنا هي إحداث ثورة في أمن المجتمع من خلال تطوير نظام مراقبة ذكي يقدم حلول حماية متقدمة وموثوقة وفعالة من حيث التكلفة، مصممة خصيصًا للبيئات التعليمية.
            </p>
          </div>

          <div className="about__block">
            <h3 className="about__subheading">بيان الرؤية</h3>
            <p className="about__description">
              نتطلع لخلق عالم حيث تعمل تقنيات الذكاء الاصطناعي المتقدمة مع أنظمة المراقبة الذكية لحماية الحرم الجامعي، وتأمين الطلاب وأعضاء هيئة التدريس والممتلكات، مع تمزير بيئة آمنة للتعلم والابتكار.
            </p>
          </div>

          <div className="about__block">
            <h3 className="about__subheading">التقنيات المستخدمة</h3>
            <ul className="about__tags" dir="ltr">
              {TAGS.map((tag) => (
                <li key={tag}>
                  <span className="about__tag">{tag}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="about__illustration">
          <img
            src={illustrationImage}
            alt=""
            className="about__image"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}

export default About;
