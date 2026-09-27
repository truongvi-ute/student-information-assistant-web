import { ActionLink } from "@/components/ActionLink";
import { APP_CONFIG } from "@/config/app";
import { MainLayout } from "@/layouts/MainLayout";

export default function App() {
  return (
    <MainLayout>
      <main className="home" id="home">
        <section className="hero" aria-labelledby="hero-title">
          <p className="eyebrow">{APP_CONFIG.description}</p>
          <h1 id="hero-title">
            Hello <span>world</span>
          </h1>
          <p className="hero-copy">
            Chào mừng bạn đến với trợ lý thông tin sinh viên. Mọi điều cần biết
            cho hành trình học tập của bạn, bắt đầu từ đây.
          </p>
          <div className="hero-actions">
            <ActionLink href="#overview" variant="primary">
              Khám phá ngay <span aria-hidden="true">↗</span>
            </ActionLink>
            <ActionLink href="#about" variant="secondary">
              Tìm hiểu thêm
            </ActionLink>
          </div>
          <p className="hero-note">
            <span className="status-dot" aria-hidden="true" />
            Sẵn sàng đồng hành cùng bạn
          </p>
        </section>

        <section className="overview" id="overview" aria-label="Tổng quan">
          <div className="overview-heading">
            <p className="eyebrow">BẮT ĐẦU THUẬN TIỆN</p>
            <h2>Một nơi cho những điều quan trọng.</h2>
          </div>
          <div className="overview-items">
            <a className="overview-item" href="#about">
              <span className="item-number">01</span>
              <span className="item-label">Thông tin học tập</span>
              <span className="item-arrow" aria-hidden="true">↗</span>
            </a>
            <a className="overview-item" href="mailto:hello@student-assistant.local">
              <span className="item-number">02</span>
              <span className="item-label">Hỗ trợ sinh viên</span>
              <span className="item-arrow" aria-hidden="true">↗</span>
            </a>
          </div>
        </section>

        <section className="about" id="about">
          <p className="eyebrow">STUDENT INFORMATION ASSISTANT</p>
          <p>Được thiết kế để việc học tập và tra cứu thông tin trở nên đơn giản hơn.</p>
        </section>
      </main>
    </MainLayout>
  );
}
