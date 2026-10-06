import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryViewer } from './SummaryViewer';
import { TemplateKey } from '@/server/constants/template.constant';

describe('SummaryViewer Organism', () => {
  it('renders loading skeleton when isLoading is true', () => {
    render(<SummaryViewer isLoading={true} />);
    expect(screen.getByTestId('summary-viewer-loading')).toBeInTheDocument();
  });

  it('renders empty state when no summary is provided', () => {
    render(<SummaryViewer summary={null} />);
    expect(screen.getByTestId('summary-viewer-empty')).toBeInTheDocument();
    expect(screen.getByText('Belum Ada Ringkasan')).toBeInTheDocument();
  });

  it('renders MOM structured template correctly', () => {
    const momData = {
      meeting_title: 'Sprint Planning Q4',
      meeting_goal: 'Finalisasi roadmap sprint',
      executive_summary: 'Rapat menyepakati prioritas fitur utama.',
      meeting_dynamics: {
        speaker_talk_time: [{ speaker: 'Bayu', percentage: 60, duration_minutes: 12 }],
        consensus_score: 'Tinggi (90%)',
        sentiment_trajectory: 'Positif Konstruktif',
      },
      stakeholder_perspectives: {
        executive_brief: 'Fokus ROI',
        engineering_focus: 'Stabilitas sistem',
        product_delivery: 'Penyelesaian MVP',
      },
      key_decisions: [
        {
          decision: 'Migrasi ke arsitektur baru',
          root_cause_trigger: 'Skalabilitas bottleneck',
          contested_points: 'Estimasi waktu',
          quantitative_impact: 'Peningkatan throughput 3x',
          approved_by: 'CTO',
        },
      ],
      action_items: [
        {
          task: 'Buat POC pipeline',
          pic: 'Bayu',
          due_date: '2026-10-10',
          priority: 'P0' as const,
          definition_of_done: 'Semua unit test pass',
          cost_of_inaction: 'Penundaan peluncuran',
        },
      ],
      open_issues: ['Kebutuhan lisensi tambahan'],
      next_meeting: 'Senin depan, 10:00 WIB',
    };

    render(
      <SummaryViewer
        summary={{
          template_category: TemplateKey.MOM,
          structured_data: momData,
          markdown_content: '# Fallback',
        }}
      />
    );

    expect(screen.getByTestId('mom-summary-renderer')).toBeInTheDocument();
    expect(screen.getByText('Sprint Planning Q4')).toBeInTheDocument();
    expect(screen.getByText('Buat POC pipeline')).toBeInTheDocument();
  });

  it('renders 1_ON_1 structured template correctly', () => {
    const oneOnOneData = {
      wellbeing_assessment: {
        sentiment_score: 'Energetic' as const,
        summary: 'Anggota tim merasa sangat termotivasi dan antusias.',
      },
      key_wins: ['Menyelesaikan audit sistem tepat waktu'],
      blockers: ['Ketergantungan pada tim infrastruktur'],
      feedback_exchanged: {
        for_report: ['Terus tingkatkan komunikasi lintas tim'],
        for_manager: ['Mohon alokasikan waktu mentoring rutin'],
      },
      growth_notes: 'Tertarik mendalami arsitektur cloud terdistribusi.',
      commitments: [
        {
          party: 'MANAGER' as const,
          action_item: 'Membantu koordinasi dengan tim infra',
          timeline: 'Minggu ini',
        },
      ],
    };

    render(
      <SummaryViewer
        summary={{
          template_category: TemplateKey.ONE_ON_ONE,
          structured_data: oneOnOneData,
        }}
      />
    );

    expect(screen.getByTestId('one-on-one-summary-renderer')).toBeInTheDocument();
    expect(screen.getByText('Menyelesaikan audit sistem tepat waktu')).toBeInTheDocument();
    expect(screen.getByText('Membantu koordinasi dengan tim infra')).toBeInTheDocument();
  });

  it('renders INTERVIEW structured template correctly', () => {
    const interviewData = {
      candidate_name: 'Budi Santoso',
      target_role: 'Senior Backend Engineer',
      recommendation: 'STRONG HIRE' as const,
      justification: 'Pemahaman sistem mendalam dan komunikasi yang sangat solid.',
      competency_scores: [
        {
          competency: 'System Design',
          rating: 'Exceeds' as const,
          evidence: 'Mampu merancang distributed cache dengan konsistensi yang baik.',
        },
      ],
      strengths: ['Problem solving analitis', 'Pengalaman Go mendalam'],
      concerns: ['Belum banyak pengalaman dengan Kubernetes production'],
      culture_fit_notes: 'Sangat cocok dengan kultur agile dan kolaboratif tim.',
      next_round_probes: ['Tanyakan lebih dalam tentang skenario zero-downtime deploy'],
    };

    render(
      <SummaryViewer
        summary={{
          template_category: TemplateKey.INTERVIEW,
          structured_data: interviewData,
        }}
      />
    );

    expect(screen.getByTestId('interview-summary-renderer')).toBeInTheDocument();
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
    expect(screen.getByText(/Strong Hire/i)).toBeInTheDocument();
  });

  it('renders TECH_REVIEW structured template correctly', () => {
    const techData = {
      context: 'Pembaruan mekanisme caching untuk mengatasi peak traffic.',
      decisions_adopted: [
        {
          decision: 'Menggunakan Redis Cluster',
          technical_justification: 'Latensi rendah dan sharding otomatis',
        },
      ],
      rejected_alternatives: [
        {
          alternative: 'Memcached',
          rejection_reason: 'Kurangnya dukungan tipe data kompleks',
        },
      ],
      nfr_assessment: {
        security: 'TLS diaktifkan pada koneksi internal',
        performance_scalability: 'Sub-millisecond query latency',
        reliability_resilience: 'Multi-AZ failover diaktifkan',
      },
      technical_debt_impact: 'Perlu script migrasi schema cache lama.',
      action_items: [
        {
          task: 'Setup Redis cluster staging',
          assignee: 'Bayu',
          target_sprint: 'Sprint 24',
        },
      ],
    };

    render(
      <SummaryViewer
        summary={{
          template_category: TemplateKey.TECH_REVIEW,
          structured_data: techData,
        }}
      />
    );

    expect(screen.getByTestId('tech-review-summary-renderer')).toBeInTheDocument();
    expect(screen.getByText('Menggunakan Redis Cluster')).toBeInTheDocument();
    expect(screen.getByText('Memcached')).toBeInTheDocument();
  });

  it('renders SALES_DISCOVERY structured template correctly', () => {
    const salesData = {
      prospect_company: 'PT Maju Digital',
      deal_stage_suggested: 'Discovery / Demo',
      pain_points: [
        {
          pain: 'Transkrip manual memakan waktu 4 jam per rapat',
          cost_of_inaction: 'Biaya operasional membengkak $20k/bulan',
        },
      ],
      desired_outcomes: ['Otomatisasi notula rapat dengan ringkasan AI'],
      meddpicc: {
        metrics: 'Penghematan waktu 80%',
        economic_buyer: 'VP Operations',
        decision_criteria: 'Akurasi transkrip bahasa Indonesia dan keamanan data',
        champion: 'Head of PMO',
        competition: 'Penyedia transkripsi konvensional',
      },
      objections: ['Kekhawatiran privasi data audio meeting internal'],
      next_steps: [
        {
          action: 'Kirimkan security whitepaper dan NDA',
          owner: 'Account Executive',
          target_date: '2026-10-08',
        },
      ],
    };

    render(
      <SummaryViewer
        summary={{
          template_category: TemplateKey.SALES_DISCOVERY,
          structured_data: salesData,
        }}
      />
    );

    expect(screen.getByTestId('sales-discovery-summary-renderer')).toBeInTheDocument();
    expect(screen.getByText('PT Maju Digital')).toBeInTheDocument();
    expect(screen.getByText('Transkrip manual memakan waktu 4 jam per rapat')).toBeInTheDocument();
  });

  it('renders DAILY_STANDUP structured template correctly', () => {
    const standupData = {
      sprint_health: {
        status: 'ON TRACK' as const,
        summary: 'Sprint berjalan lancar, semua task prioritas mendekati selesai.',
      },
      member_updates: [
        {
          member_name: 'Dewi',
          yesterday: ['Menyelesaikan komponen audio player'],
          today: ['Mengerjakan summary viewer polymorphism'],
          blockers: [],
        },
      ],
      critical_blockers: [],
      parking_lot_discussions: [
        {
          topic: 'Standardisasi format timestamp video',
          participants: ['Dewi', 'Bayu'],
        },
      ],
    };

    render(
      <SummaryViewer
        summary={{
          template_category: TemplateKey.DAILY_STANDUP,
          structured_data: standupData,
        }}
      />
    );

    expect(screen.getByTestId('daily-standup-summary-renderer')).toBeInTheDocument();
    expect(screen.getByText('Dewi')).toBeInTheDocument();
    expect(screen.getByText('Menyelesaikan komponen audio player')).toBeInTheDocument();
  });

  it('renders GENERAL structured template correctly', () => {
    const generalData = {
      executive_overview: 'Diskusi strategi pengembangan produk tahun 2027.',
      core_themes: [
        {
          theme: 'Adopsi AI Voice Agent',
          summary_points: ['Peluang pasar enterprise', 'Kebutuhan integrasi Zoom/Meet'],
        },
      ],
      key_takeaways: ['Fokus pada latensi rendah di bawah 2 detik'],
      notable_quotes: [
        {
          quote: 'Pengalaman pengguna adalah pembeda utama produk kita.',
          speaker: 'CEO',
          context: 'Saat pembukaan sesi visi produk',
        },
      ],
      referenced_resources: ['https://example.com/voice-benchmark'],
    };

    render(
      <SummaryViewer
        summary={{
          template_category: TemplateKey.GENERAL,
          structured_data: generalData,
        }}
      />
    );

    expect(screen.getByTestId('general-summary-renderer')).toBeInTheDocument();
    expect(screen.getByText('Adopsi AI Voice Agent')).toBeInTheDocument();
    expect(screen.getByText(/Pengalaman pengguna adalah pembeda utama/i)).toBeInTheDocument();
  });

  it('falls back to markdown fallback if structured data is incomplete or invalid', () => {
    render(
      <SummaryViewer
        summary={{
          template_category: TemplateKey.MOM,
          structured_data: { invalid_key: true },
          markdown_content: 'Ini adalah ringkasan fallback markdown naratif.',
        }}
      />
    );

    expect(screen.getByTestId('markdown-summary-fallback')).toBeInTheDocument();
    expect(screen.getByText('Ini adalah ringkasan fallback markdown naratif.')).toBeInTheDocument();
  });

  it('renders custom angle banner when custom_angle is present', () => {
    render(
      <SummaryViewer
        summary={{
          template_category: TemplateKey.GENERAL,
          custom_angle: 'Sorot aspek keamanan dan audit finansial',
          markdown_content: 'Ringkasan narasi.',
        }}
      />
    );

    expect(screen.getByText(/Sorot aspek keamanan dan audit finansial/i)).toBeInTheDocument();
  });
});
