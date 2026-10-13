export const idPipeline = {
  header: {
    loadingTitle: 'Memuat Rekaman...',
    backToDashboard: 'Kembali ke Dashboard',
    backToHome: 'Kembali ke Beranda',
  },
  stages: {
    uploading: {
      name: 'Unggah Berkas',
      description: 'Menyimpan berkas media ke penyimpanan aman',
    },
    extracting: {
      name: 'Ekstraksi Audio',
      description: 'Mengekstrak dan menormalisasi trek audio',
    },
    transcribing: {
      name: 'Transkripsi AI',
      description: 'Mengonversi ucapan suara menjadi teks dengan tanda waktu',
    },
    diarizing: {
      name: 'Pemisahan Pembicara',
      description: 'Mengidentifikasi dan membedakan tiap pembicara',
    },
    synthesizing: {
      name: 'Sintesis Ringkasan',
      description: 'Menghasilkan intisari keputusan, poin aksi, dan wawasan utama',
    },
    completed: {
      name: 'Selesai',
      description: 'Hasil transkripsi dan analisis siap digunakan',
    },
    failed: {
      name: 'Gagal',
      description: 'Pemrosesan rekaman terhenti karena kendala sistem',
    },
  },
  status: {
    processingTitle: 'Sedang Memproses Rekaman',
    processingSubtitle: 'Mohon tunggu, AI kami sedang menganalisis berkas percakapan Anda.',
    completedTitle: 'Pemrosesan Berhasil Selesai!',
    completedSubtitle: 'Rekaman telah berhasil diproses. Membuka lembar kerja...',
    failedTitle: 'Pemrosesan Gagal',
    failedSubtitle: 'Terjadi kendala saat menganalisis rekaman.',
    viewResult: 'Lihat Hasil Transkripsi',
    retryProcess: 'Coba Ulang Pemrosesan',
    cancelProcess: 'Batalkan & Hapus',
    cancellingProcess: 'Membatalkan...',
    cancelModalTitle: 'Batalkan Pemrosesan Rekaman?',
    cancelModalDescription: 'Rekaman ini akan dibatalkan dan dihapus secara permanen dari sistem untuk membersihkan antrean pemrosesan.',
    cancelConfirmButton: 'Ya, Batalkan & Hapus',
    cancelSuccess: 'Sesi rekaman berhasil dibatalkan dan dibersihkan.',
    cancelFailed: 'Gagal membatalkan rekaman. Silakan coba lagi.',
    staleWarningTitle: 'Pemrosesan Berjalan Terlalu Lama / Terhenti',
    staleWarningDescription: 'Pemrosesan telah berjalan lebih dari 10 menit tanpa kemajuan baru. Sesi ini kemungkinan terhenti karena kendala jaringan atau kegagalan pipeline. Anda dapat membatalkan dan membersihkannya sekarang.',
    elapsedTime: 'Waktu Berjalan',
    estimatedRemaining: 'Perkiraan Sisa',
  },
  stepper: {
    headlineProcessing: 'Menganalisis Percakapan...',
    headlineCompleted: 'Pemrosesan Selesai',
    headlineFailed: 'Pemrosesan Terhenti',
    retryButton: 'Coba Lagi',
    retryingButton: 'Memulai Ulang...',
    cancelButton: 'Batalkan & Bersihkan',
    steps: {
      extraction: {
        title: 'Validasi & Ekstraksi',
        description: 'Verifikasi berkas audio, format stream & normalisasi sampel',
      },
      transcription: {
        title: 'Transkripsi Multi-Pembicara',
        description: 'Diarisasi ujaran, stempel waktu, dan pengenalan pembicara',
      },
      intelligence: {
        title: 'AI Intelligence & Pengindeksan',
        description: 'Sintesis ringkasan notula, action items, dan vektor semantik',
      },
      completed: {
        title: 'Siap Ditinjau',
        description: 'Seluruh analitik rekaman dan transkripsi siap diakses',
      },
    },
  },
  errors: {
    defaultTitle: 'Pemrosesan Rekaman Terkendala',
    defaultDescription: 'Terjadi kendala teknis saat memproses aliran pipeline.',
    conflictInProgress: 'Pipeline sedang diproses kembali di latar belakang.',
    conflictFailed: 'Gagal memicu percobaan ulang. Silakan coba sesaat lagi.',
    retryButton: 'Coba Lagi dari Tahap Terakhir',
    retryingButton: 'Memulai Ulang Pipeline...',
    restartingMessage: 'Memulai ulang pemrosesan pipeline...',
    retryFailedMessage: 'Gagal memulai ulang pemrosesan.',
    haltedMessage: 'Pemrosesan rekaman terhenti.',
    defaultAudioTitle: 'Rekaman Audio',
    taxonomy: {
      ERR_AUDIO_CORRUPT: {
        title: 'Berkas Audio Tidak Valid atau Rusak',
        description: 'Format audio tidak dapat dibaca atau file terpotong saat pengunggahan.',
      },
      ERR_EXTRACTION_FAILED: {
        title: 'Ekstraksi Audio Gagal',
        description: 'Sistem gagal mengekstrak aliran audio dari media yang diunggah.',
      },
      ERR_TRANSCRIPTION_FAILED: {
        title: 'Transkripsi Speech-to-Text Terkendala',
        description: 'Mesin AI transkripsi mengalami gangguan saat memproses ujaran suara.',
      },
      ERR_NO_SPEECH_DETECTED: {
        title: 'Tidak Ada Percakapan Terdeteksi',
        description: 'Tidak ditemukan suara atau percakapan manusia yang dapat ditranskripsikan.',
      },
      ERR_SUMMARIZATION_FAILED: {
        title: 'Ringkasan AI Mengalami Gangguan',
        description: 'Model AI mengalami kegagalan saat mengekstraksi poin dan ringkasan terstruktur.',
      },
      ERR_INDEXING_FAILED: {
        title: 'Pengindeksan Vektor Semantik Gagal',
        description: 'Gagal membuat indeks memori untuk fitur pencarian percakapan.',
      },
      ERR_PIPELINE_TIMEOUT: {
        title: 'Pemrosesan Melebihi Batas Waktu (Timeout)',
        description: 'Pemrosesan rekaman melebihi batas durasi wajar atau aliran pipeline terputus.',
      },
      ERR_GDRIVE_ACCESS_DENIED: {
        title: 'Akses Google Drive Ditolak / Berkas Privat',
        description: 'Berkas Google Drive ini bersifat privat atau memerlukan izin akses. Harap ubah setelan berbagi menjadi "Siapa saja yang memiliki link" (Anyone with the link), lalu coba lagi.',
      },
      ERR_IMPORT_FETCH_FAILED: {
        title: 'Impor Media Gagal',
        description: 'Tidak dapat mengunduh media dari tautan yang diberikan. Pastikan tautan valid dan dapat diakses secara publik.',
      },
      ERR_UNSUPPORTED_MEDIA_TYPE: {
        title: 'Format Media Tidak Didukung',
        description: 'Media yang ditautkan atau diunggah berformat tidak didukung atau tidak memiliki aliran audio yang valid.',
      },
    },
  },
};
