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
    elapsedTime: 'Waktu Berjalan',
    estimatedRemaining: 'Perkiraan Sisa',
  },
};
