export const idDashboard = {
  welcome: {
    title: 'Halo, {name} 👋',
    defaultName: 'Pengguna',
    subtitle:
      'Selamat datang di perpustakaan rekaman cerdas Anda. Akses transkrip, notulen rapat otomatis, dan intisari AI kapan saja.',
    quotaTitle: 'Kuota Transkrip Harian',
    quotaRemaining: '{remaining} dari {total} rekaman tersisa',
    quotaRemainingSuffix: 'dari {total} rekaman tersisa',
    newRecording: 'Rekaman Baru',
  },
  search: {
    placeholder: 'Cari berdasarkan judul atau nama file...',
  },
  filters: {
    allStatuses: 'Semua Status',
    allTemplates: 'Semua Template',
    gridView: 'Tampilan Grid',
    tableView: 'Tampilan Tabel',
    refresh: 'Segarkan data',
    reset: 'Reset Filter',
  },
  statusLabels: {
    completed: 'Selesai',
    queued: 'Dalam Antrean',
    processing: 'Sedang Diproses',
    failed: 'Gagal',
  },
  table: {
    titleHeader: 'Judul Rekaman',
    templateHeader: 'Template',
    statusHeader: 'Status',
    durationHeader: 'Durasi',
    dateHeader: 'Tanggal',
    actionsHeader: 'Aksi',
    viewDetail: 'Lihat detail',
    share: 'Bagikan',
    delete: 'Hapus rekaman',
  },
  pagination: {
    showing: 'Menampilkan {start} - {end} dari {total} rekaman',
    prev: 'Sebelumnya',
    next: 'Selanjutnya',
    pageOf: 'Halaman {page} dari {total}',
  },
  empty: {
    title: 'Belum Ada Rekaman',
    description:
      'Mulai unggah berkas audio atau rekam percakapan rapat pertama Anda untuk mendapatkan transkrip otomatis.',
    action: 'Buat Rekaman Baru',
    searchTitle: 'Tidak ada hasil yang cocok',
    searchDescription:
      'Coba sesuaikan kata kunci pencarian atau ubah filter untuk menemukan rekaman Anda.',
  },
  error: {
    title: 'Gagal Memuat Data',
    defaultMessage: 'Terjadi kesalahan saat memuat rekaman.',
    fetchFailed: 'Gagal memuat daftar rekaman.',
    retry: 'Coba Lagi',
  },
  deleteDialog: {
    title: 'Hapus Rekaman?',
    description:
      'Apakah Anda yakin ingin menghapus rekaman "{title}"? Seluruh transkrip, ringkasan, dan komentar akan dihapus secara permanen.',
    cancel: 'Batal',
    deleting: 'Menghapus...',
    confirm: 'Ya, Hapus',
  },
  loading: {
    verifyingSession: 'Memverifikasi sesi akun...',
  },
};
