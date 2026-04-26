# 🦅 Eagle Tailors Digitization System
### ईगल टेलर्स डिजिटाइजेशन सिस्टम

A complete digital management system for Eagle Tailors, Meerut - transforming traditional paper-based tailoring operations into a modern, searchable digital system.

---

## 🎯 Vision

> **"This system never replaces your book. It only helps you find it faster."**

A digital photo archive that enables instant search while preserving the familiar paper workflow.

---

## ✨ Key Features

### Phase 1A - Core System ✅
- 📷 **Photo Upload** - Capture bills from phone camera or gallery
- 🔍 **Instant Search** - Find customers by phone, folio, or name in seconds
- 👥 **Customer Management** - Store customer details with multiple phone numbers
- 📖 **Book Management** - Manage multiple ledger books (2023-24, 2024-25, etc.)
- 🖼️ **Image Storage** - Automatic compression and thumbnail generation
- 📱 **Responsive Design** - Works on mobile and laptop
- 🌙 **High Contrast Mode** - Better visibility in workshop lighting

### Phase 1B - Enhanced Safety (Week 3)
- 🔐 PIN Authentication - 4-digit PIN access
- 👥 Duplicate Detection - Fuzzy name matching
- 🗑️ Soft Delete - 90-day recovery period
- 📝 Audit Log - Complete change history
- 🔄 Merge Customers - Combine duplicate entries

### Phase 2 - Smart OCR (Weeks 4-6)
- 🤖 Free OCR - PaddleOCR for Hindi + English
- 📊 Auto-Extract - Automatic data extraction from photos
- 🎤 Voice Input - Speak measurements
- 🟢🟡🔴 Confidence Indicators - Visual quality feedback
- 📦 Bulk Upload - Digitize old books quickly

### Phase 3+ - Advanced Features (Future)
- 📱 QR Code Receipts - Customer order tracking
- 🖨️ Thermal Printing - Receipts and garment tags
- 🚚 Delivery Tracking - Status updates
- 💰 Payment Dashboard - Pending balances
- 📊 Business Intelligence - Reports and insights

---

## 🛠️ Technology Stack

| Component | Technology | Why |
|-----------|------------|-----|
| **Frontend** | React + Vite | Fast, modern, responsive |
| **Backend** | Node.js + Express | JavaScript ecosystem |
| **Database** | PostgreSQL | Robust, JSONB support |
| **OCR** | PaddleOCR (Python) | Free, Hindi + English |
| **Image Processing** | Sharp + OpenCV | Real-world photo handling |
| **Deployment** | Local (Laptop) | No hosting cost, offline |

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     EAGLE TAILORS SYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   📱 Frontend (React)                                        │
│   └─> localhost:3000                                        │
│        │                                                     │
│        ├─> 👤 Customer Management                           │
│        ├─> 📷 Bill Upload                                   │
│        ├─> 🔍 Search & History                              │
│        └─> 📊 Dashboards                                    │
│                                                              │
│   🔧 Backend API (Node.js)                                  │
│   └─> localhost:3001                                        │
│        │                                                     │
│        ├─> REST API Endpoints                               │
│        ├─> Image Processing                                 │
│        ├─> File Upload Handling                             │
│        └─> Business Logic                                   │
│                                                              │
│   🗄️ Database (PostgreSQL)                                  │
│   └─> localhost:5432                                        │
│        │                                                     │
│        ├─> Customers & Phones                               │
│        ├─> Bills & Measurements                             │
│        ├─> Books & Folios                                   │
│        └─> Audit Logs                                       │
│                                                              │
│   🤖 OCR Service (Python) [Optional - Phase 2]             │
│   └─> localhost:5000                                        │
│        │                                                     │
│        ├─> PaddleOCR Engine                                 │
│        ├─> Image Preprocessing                              │
│        └─> Text Extraction                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL v14+
- Python 3.8+ (for OCR service)

### Installation (5 minutes)

```bash
# 1. Clone or extract the project
cd Eagle_taliors

# 2. Install dependencies (Windows)
scripts\setup.bat

# OR manually:
cd backend && npm install
cd ../frontend && npm install
cd ../ocr-service && pip install -r requirements.txt

# 3. Create database
createdb eagle_tailors

# 4. Run migrations
cd backend && node scripts/migrate.js

# 5. Start all services (3 terminals)
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: OCR (optional)
cd ocr-service && python main.py
```

### Access the App
Open browser: **http://localhost:3000**

---

## 📖 Database Schema

```
CUSTOMERS
├── id (UUID)
├── name
├── address
├── notes
└── phones[] (multiple)

BILLS
├── id (UUID)
├── folio_number
├── customer_id
├── book_id
├── image_url
├── bill_date
├── delivery_date
├── total_amount
├── advance_paid
├── balance_due (computed)
└── status

BOOKS
├── id (UUID)
├── name (e.g., "2025-26")
├── start_serial
├── end_serial
└── is_current

BILL_MEASUREMENTS
├── id (UUID)
├── bill_id
├── garment_type_id
├── measurements (JSONB)
├── confidence (JSONB)
└── is_verified
```

---

## 📱 User Interface

### Home Screen
- Quick search bar
- Upload Bill button
- Statistics dashboard
- Quick actions (Books, Deliveries)

### Upload Bill
- Camera/gallery selector
- Auto-suggest folio number
- Customer phone lookup
- Date pickers
- Amount fields

### Customer Detail
- Customer info & phones
- Order history grouped by book
- Statistics (total bills, value, balance)
- Status badges

### Search Results
- Instant results as you type
- Fuzzy name matching
- Multiple phone support
- Customer preview cards

---

## 🔐 Security Features

- **PIN Authentication** - 4-digit PIN for access (Phase 1B)
- **Role-Based Access** - Owner vs Helper permissions
- **Soft Delete** - 90-day recovery period
- **Audit Trail** - Complete change history
- **Local Storage** - Data stays in shop
- **Offline First** - No internet required

---

## 💾 Data Safety

### Automatic Backups (Planned)
- Daily automatic backups at 2 AM
- 30-day retention
- Manual USB backup support
- Optional Google Drive sync

### Storage Requirements
- ~100 MB per month
- ~1.2 GB per year
- ~6 GB for 5 years
- Images auto-compressed 90%+

---

## 📊 Key Statistics

| Metric | Value |
|--------|-------|
| **Setup Time** | 5-10 minutes |
| **Monthly Cost** | ₹0 (local deployment) |
| **Storage/Month** | ~100 MB |
| **Search Speed** | < 1 second |
| **Image Compression** | 90% reduction |
| **Offline Support** | ✅ Yes |
| **Hindi Support** | ✅ Full |

---

## 🎯 Workflow Comparison

### Before (Manual System)
1. Customer calls for old measurement
2. Search index book alphabetically
3. Find folio number references
4. Check each folio in books
5. May need to check godown storage
6. **Time: 5-10 minutes**

### After (Digital System)
1. Customer calls
2. Type phone number in search
3. View complete history
4. Click to see bill image
5. **Time: 5 seconds**

---

## 📞 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Key Endpoints

#### Customers
```http
POST   /customers              Create customer
GET    /customers/search       Search by phone/name
GET    /customers/:id          Get customer details
PUT    /customers/:id          Update customer
DELETE /customers/:id          Soft delete
```

#### Bills
```http
POST   /bills                  Upload bill (multipart)
GET    /bills/folio/:folio     Search by folio
GET    /bills/customer/:id     Get customer bills
GET    /bills/due-deliveries   Get pending deliveries
PUT    /bills/:id              Update bill
```

#### Books
```http
GET    /books/current          Get current book
GET    /books/:id/next-folio   Get next folio
PUT    /books/:id/set-current  Set as current
```

---

## 🧪 Testing Checklist

- [ ] Create new book
- [ ] Add customer with multiple phones
- [ ] Upload bill with image
- [ ] Search by phone number
- [ ] Search by customer name
- [ ] View customer history
- [ ] View bill details with image zoom
- [ ] Check delivery dashboard
- [ ] Verify image storage in uploads/
- [ ] Test on mobile browser

---

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check PostgreSQL is running
services.msc  # Windows

# Verify credentials in backend/.env
```

**Port Already in Use**
```bash
# Change port in vite.config.js (frontend)
# or backend/.env (backend)
```

**Images Not Loading**
```bash
# Check uploads/ folder exists
# Verify backend is serving static files
```

**OCR Service Error**
```bash
# Reinstall Python dependencies
pip install --upgrade paddleocr paddlepaddle
```

---

## 📚 Documentation

- **Master Plan:** `eagle_tailors_master_plan_v1.1.md` - Complete project specification
- **Build Instructions:** `BUILD_INSTRUCTIONS.md` - Setup and deployment guide
- **Coding Standards:** `claude.md` - Development guidelines

---

## 🗺️ Roadmap

### ✅ Phase 1A (Completed)
- Core features
- Image upload
- Search functionality

### 🔄 Phase 1B (Week 3)
- PIN authentication
- Duplicate detection
- Soft delete & restore

### 📅 Phase 2 (Weeks 4-6)
- OCR integration
- Voice input
- Measurement extraction

### 🔮 Phase 3+ (Future)
- QR codes
- Thermal printing
- SMS notifications
- Custom ML model

---

## 👥 Team

**Developed for:**
- Eagle Tailors, Sadar Bazar
- Laxmi Narayan Dharamshala
- Meerut Cantt
- Ph: 2660605

---

## 📄 License

Custom solution for Eagle Tailors.
© 2026 Eagle Tailors. All rights reserved.

---

## 🙏 Acknowledgments

- **PaddleOCR** - Free OCR engine
- **PostgreSQL** - Robust database
- **React** - Modern UI framework
- **Sharp** - Fast image processing

---

## 📞 Support

For technical support or questions:
1. Check BUILD_INSTRUCTIONS.md
2. Review troubleshooting section
3. Check console logs
4. Verify all services are running

---

**Built with ❤️ for Eagle Tailors, Meerut**

*Making traditional tailoring businesses digital, one photo at a time.*
