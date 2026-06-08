/**
 * data.ts — Mock Test Data for MOEI Housing Arrears Rescheduling
 *
 * 10 realistic test cases designed to exercise different compliance engine paths.
 * Each case has ALL fields populated with realistic values.
 */

import { ReschedulingApplication } from './types';

export const mockApplications: ReschedulingApplication[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // Case 1: Saeed Al-Mansoori — Easy APPROVE
  // Employed, salary 35,000, married, 3 dependents, arrears 12,000 (3 months)
  // Salary stable, current EMI 4,500, remaining 120 months, UPDATE_INSTALLMENT
  // All docs stamped → Should APPROVE easily
  // ─────────────────────────────────────────────────────────────────────────────
  {
    application_id: 'MSZHP_100201',
    request_type: 'UPDATE_INSTALLMENT',
    deduct_from_salary: true,
    created_date: '2026-05-10T09:30:00Z',
    has_prior_active_request: false,
    beneficiary: {
      full_name: 'Saeed Mohammad Al-Mansoori',
      full_name_ar: 'سعيد محمد المنصوري',
      emirates_id: '784-1985-4521458-1',
      customer_id: 'EDB_CUS_001201',
      marital_status: 'MARRIED',
      employment_status: 'EMPLOYED',
      location_emirate: 'Abu Dhabi',
      is_person_of_determination: false,
    },
    family: {
      dependents_count: 3,
      total_family_members: 5,
    },
    income: {
      current_salary: 35000,
      salary_trend: 'STABLE',
      income_source: 'Government',
      total_obligations: 8500,
      obligations_to_income_ratio: 0.24,
    },
    loan: {
      agreement_id: 'MAGREE_30142',
      edb_loan_id: 'EDB_LN_90281',
      original_loan_amount: 800000,
      remaining_balance: 520000,
      original_period_months: 300,
      remaining_period_months: 120,
      current_emi: 4500,
      payment_history_summary: 'Regular payments until 3 months ago; temporary disruption due to medical leave.',
    },
    arrears: {
      overdue_amount: 12000,
      overdue_months: 3,
      reason_for_delay: 'Temporary medical leave caused salary disruption for two months.',
      supporting_documents: [
        { name: 'salary_certificate_2026.pdf', type: 'SALARY_CERTIFICATE', is_stamped: true, is_valid: true },
        { name: 'bank_statement_q1_2026.pdf', type: 'BANK_STATEMENT', is_stamped: true, is_valid: true },
        { name: 'medical_leave_certificate.pdf', type: 'MEDICAL_REPORT', is_stamped: true, is_valid: true },
        { name: 'employer_confirmation_letter.pdf', type: 'EMPLOYER_LETTER', is_stamped: true, is_valid: true },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Case 2: Fatima Al-Ali — APPROVE transfer
  // Retired (pension), salary 12,000, widowed, 4 dependents (6 family)
  // Arrears 19,200 (8 months), TRANSFER_ARREARS
  // ─────────────────────────────────────────────────────────────────────────────
  {
    application_id: 'MSZHP_100302',
    request_type: 'TRANSFER_ARREARS',
    deduct_from_salary: true,
    created_date: '2026-04-22T11:15:00Z',
    has_prior_active_request: false,
    beneficiary: {
      full_name: 'Fatima Hassan Al-Ali',
      full_name_ar: 'فاطمة حسن العلي',
      emirates_id: '784-1968-1234567-5',
      customer_id: 'EDB_CUS_002305',
      marital_status: 'WIDOWED',
      employment_status: 'RETIRED',
      location_emirate: 'Abu Dhabi',
      is_person_of_determination: false,
    },
    family: {
      dependents_count: 4,
      total_family_members: 6,
      special_circumstances: 'Widowed with 4 dependents including 2 school-age children.',
    },
    income: {
      current_salary: 12000,
      salary_trend: 'STABLE',
      income_source: 'Pension',
      total_obligations: 5200,
      obligations_to_income_ratio: 0.43,
    },
    loan: {
      agreement_id: 'MAGREE_20198',
      edb_loan_id: 'EDB_LN_70456',
      original_loan_amount: 600000,
      remaining_balance: 380000,
      original_period_months: 360,
      remaining_period_months: 180,
      current_emi: 2400,
      payment_history_summary: 'Consistent payments for 15 years; recent 8-month gap following spouse passing.',
    },
    arrears: {
      overdue_amount: 19200,
      overdue_months: 8,
      reason_for_delay: 'Sustained family medical expenses and bereavement after spouse passing. Pension is sole income.',
      supporting_documents: [
        { name: 'pension_certificate_2026.pdf', type: 'PENSION_CERTIFICATE', is_stamped: true, is_valid: true },
        { name: 'salary_certificate_pension.pdf', type: 'SALARY_CERTIFICATE', is_stamped: true, is_valid: true },
        { name: 'bank_statement_6months.pdf', type: 'BANK_STATEMENT', is_stamped: true, is_valid: true },
        { name: 'death_certificate_spouse.pdf', type: 'OTHER', is_stamped: true, is_valid: true },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Case 3: Maryam Al-Heera — Low income per member, lighter plan
  // Employed, salary 15,570, married, 5 dependents (7 family)
  // avg income per member ~2,224 (below 2,500), arrears 33,072 (16 months)
  // Medical retirement, TRANSFER_ARREARS
  // ─────────────────────────────────────────────────────────────────────────────
  {
    application_id: 'MSZHP_100403',
    request_type: 'TRANSFER_ARREARS',
    deduct_from_salary: true,
    created_date: '2026-03-15T08:45:00Z',
    has_prior_active_request: false,
    beneficiary: {
      full_name: 'Maryam Rashid Al-Heera',
      full_name_ar: 'مريم راشد الحيرة',
      emirates_id: '784-1975-9876543-9',
      customer_id: 'EDB_CUS_003178',
      marital_status: 'MARRIED',
      employment_status: 'MEDICAL_RETIREMENT',
      location_emirate: 'Sharjah',
      is_person_of_determination: true,
    },
    family: {
      dependents_count: 5,
      total_family_members: 7,
      special_circumstances: 'Medical retirement due to chronic condition. Spouse is primary caregiver.',
    },
    income: {
      current_salary: 15570,
      salary_trend: 'DECREASED',
      income_source: 'Medical Pension',
      total_obligations: 7000,
      obligations_to_income_ratio: 0.45,
    },
    loan: {
      agreement_id: 'MAGREE_15673',
      edb_loan_id: 'EDB_LN_55892',
      original_loan_amount: 700000,
      remaining_balance: 490000,
      original_period_months: 360,
      remaining_period_months: 200,
      current_emi: 2067,
      payment_history_summary: 'Regular until medical retirement 18 months ago; sporadic payments since.',
    },
    arrears: {
      overdue_amount: 33072,
      overdue_months: 16,
      reason_for_delay: 'تم تقاعدي طبيا .. يرجى النظر في طلبي',
      supporting_documents: [
        { name: 'salary_certificate_medical.pdf', type: 'SALARY_CERTIFICATE', is_stamped: true, is_valid: true },
        { name: 'bank_statement_q4_2025.pdf', type: 'BANK_STATEMENT', is_stamped: true, is_valid: true },
        { name: 'medical_report_chronic.pdf', type: 'MEDICAL_REPORT', is_stamped: true, is_valid: true },
        { name: 'pod_determination_card.pdf', type: 'OTHER', is_stamped: true, is_valid: true },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Case 4: Hamad Al-Nuaimi — Salary decreased, conditional/REFER
  // Employed, salary 27,955, married, 4 dependents, arrears 48,757 (13 months)
  // Current EMI 3,751, UPDATE_INSTALLMENT. Salary decreased.
  // ─────────────────────────────────────────────────────────────────────────────
  {
    application_id: 'MSZHP_100504',
    request_type: 'UPDATE_INSTALLMENT',
    deduct_from_salary: true,
    created_date: '2026-02-28T14:20:00Z',
    has_prior_active_request: false,
    beneficiary: {
      full_name: 'Hamad Abdullah Al-Nuaimi',
      full_name_ar: 'حمد عبدالله النعيمي',
      emirates_id: '784-1982-4567890-2',
      customer_id: 'EDB_CUS_004892',
      marital_status: 'MARRIED',
      employment_status: 'EMPLOYED',
      location_emirate: 'Fujairah',
      is_person_of_determination: false,
    },
    family: {
      dependents_count: 4,
      total_family_members: 6,
    },
    income: {
      current_salary: 27955,
      salary_trend: 'DECREASED',
      income_source: 'Government',
      total_obligations: 10500,
      obligations_to_income_ratio: 0.38,
    },
    loan: {
      agreement_id: 'MAGREE_25401',
      edb_loan_id: 'EDB_LN_62347',
      original_loan_amount: 900000,
      remaining_balance: 620000,
      original_period_months: 300,
      remaining_period_months: 156,
      current_emi: 3751,
      payment_history_summary: 'Regular payments until salary reduction 15 months ago.',
    },
    arrears: {
      overdue_amount: 48757,
      overdue_months: 13,
      reason_for_delay: 'تم تخفيض راتبي بسبب إعادة هيكلة الجهة الحكومية التي أعمل بها.',
      supporting_documents: [
        { name: 'salary_certificate_2026.pdf', type: 'SALARY_CERTIFICATE', is_stamped: true, is_valid: true },
        { name: 'bank_statement_recent.pdf', type: 'BANK_STATEMENT', is_stamped: true, is_valid: true },
        { name: 'employer_restructuring_notice.pdf', type: 'EMPLOYER_LETTER', is_stamped: true, is_valid: true },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Case 5: Khalid Al-Shehhi — REQUEST_DOCUMENTS (unstamped cert)
  // Employed, salary 30,000, has UNSTAMPED salary certificate
  // Arrears 9,000, 3 months
  // ─────────────────────────────────────────────────────────────────────────────
  {
    application_id: 'MSZHP_100605',
    request_type: 'UPDATE_INSTALLMENT',
    deduct_from_salary: true,
    created_date: '2026-05-02T10:00:00Z',
    has_prior_active_request: false,
    beneficiary: {
      full_name: 'Khalid Ibrahim Al-Shehhi',
      full_name_ar: 'خالد إبراهيم الشحي',
      emirates_id: '784-1990-2345678-0',
      customer_id: 'EDB_CUS_005634',
      marital_status: 'MARRIED',
      employment_status: 'EMPLOYED',
      location_emirate: 'Ras Al Khaimah',
      is_person_of_determination: false,
    },
    family: {
      dependents_count: 3,
      total_family_members: 5,
    },
    income: {
      current_salary: 30000,
      salary_trend: 'STABLE',
      income_source: 'Private Sector',
      total_obligations: 6000,
      obligations_to_income_ratio: 0.20,
    },
    loan: {
      agreement_id: 'MAGREE_31205',
      edb_loan_id: 'EDB_LN_81923',
      original_loan_amount: 750000,
      remaining_balance: 480000,
      original_period_months: 300,
      remaining_period_months: 144,
      current_emi: 3000,
      payment_history_summary: 'Regular payments; 3-month gap due to employer transition.',
    },
    arrears: {
      overdue_amount: 9000,
      overdue_months: 3,
      reason_for_delay: 'Disruption in payroll schedules due to transition between employers.',
      supporting_documents: [
        { name: 'salary_certificate_draft.pdf', type: 'SALARY_CERTIFICATE', is_stamped: false, is_valid: true, validation_notes: 'Document lacks official employer stamp' },
        { name: 'bank_statement_rak_2026.pdf', type: 'BANK_STATEMENT', is_stamped: true, is_valid: true },
        { name: 'aecb_liability_letter.pdf', type: 'OTHER', is_stamped: true, is_valid: true },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Case 6: Ahmed Al-Dhaheri — High arrears, extended plan or referral
  // Employed, salary 44,000, married, 2 dependents, arrears 132,846 (21 months)
  // Current EMI 6,326, UPDATE_INSTALLMENT
  // ─────────────────────────────────────────────────────────────────────────────
  {
    application_id: 'MSZHP_100706',
    request_type: 'UPDATE_INSTALLMENT',
    deduct_from_salary: true,
    created_date: '2026-01-18T13:45:00Z',
    has_prior_active_request: false,
    beneficiary: {
      full_name: 'Ahmed Sultan Al-Dhaheri',
      full_name_ar: 'أحمد سلطان الظاهري',
      emirates_id: '784-1978-3456789-7',
      customer_id: 'EDB_CUS_006421',
      marital_status: 'MARRIED',
      employment_status: 'EMPLOYED',
      location_emirate: 'Al Ain',
      is_person_of_determination: false,
    },
    family: {
      dependents_count: 2,
      total_family_members: 4,
    },
    income: {
      current_salary: 44000,
      salary_trend: 'STABLE',
      income_source: 'Government',
      total_obligations: 15000,
      obligations_to_income_ratio: 0.34,
    },
    loan: {
      agreement_id: 'MAGREE_28567',
      edb_loan_id: 'EDB_LN_73201',
      original_loan_amount: 1200000,
      remaining_balance: 850000,
      original_period_months: 360,
      remaining_period_months: 204,
      current_emi: 6326,
      payment_history_summary: 'Consistent for 10 years; 21-month gap due to business investment losses.',
    },
    arrears: {
      overdue_amount: 132846,
      overdue_months: 21,
      reason_for_delay: 'تعرضت لخسائر مالية كبيرة بسبب استثمارات تجارية فاشلة.',
      supporting_documents: [
        { name: 'salary_certificate_2026.pdf', type: 'SALARY_CERTIFICATE', is_stamped: true, is_valid: true },
        { name: 'bank_statement_12months.pdf', type: 'BANK_STATEMENT', is_stamped: true, is_valid: true },
        { name: 'business_loss_statement.pdf', type: 'OTHER', is_stamped: true, is_valid: true },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Case 7: Noura Al-Kaabi — Standard case, UPDATE_INSTALLMENT
  // Employed, salary 30,766, married, 3 dependents, arrears 47,571 (11 months)
  // Current EMI 4,251
  // ─────────────────────────────────────────────────────────────────────────────
  {
    application_id: 'MSZHP_100807',
    request_type: 'UPDATE_INSTALLMENT',
    deduct_from_salary: true,
    created_date: '2026-04-05T16:30:00Z',
    has_prior_active_request: false,
    beneficiary: {
      full_name: 'Noura Saif Al-Kaabi',
      full_name_ar: 'نورة سيف الكعبي',
      emirates_id: '784-1988-5678901-3',
      customer_id: 'EDB_CUS_007589',
      marital_status: 'MARRIED',
      employment_status: 'EMPLOYED',
      location_emirate: 'Dubai',
      is_person_of_determination: false,
    },
    family: {
      dependents_count: 3,
      total_family_members: 5,
    },
    income: {
      current_salary: 30766,
      salary_trend: 'STABLE',
      income_source: 'Government',
      total_obligations: 12000,
      obligations_to_income_ratio: 0.39,
    },
    loan: {
      agreement_id: 'MAGREE_33891',
      edb_loan_id: 'EDB_LN_85714',
      original_loan_amount: 850000,
      remaining_balance: 560000,
      original_period_months: 300,
      remaining_period_months: 168,
      current_emi: 4251,
      payment_history_summary: 'Regular until 11 months ago; financial strain from spouse illness.',
    },
    arrears: {
      overdue_amount: 47571,
      overdue_months: 11,
      reason_for_delay: 'السلام عليكم ورحمة الله وبركاته',
      supporting_documents: [
        { name: 'salary_certificate_2026.pdf', type: 'SALARY_CERTIFICATE', is_stamped: true, is_valid: true },
        { name: 'bank_statement_dubai.pdf', type: 'BANK_STATEMENT', is_stamped: true, is_valid: true },
        { name: 'medical_expense_receipts.pdf', type: 'MEDICAL_REPORT', is_stamped: true, is_valid: true },
        { name: 'employer_hardship_letter.pdf', type: 'EMPLOYER_LETTER', is_stamped: true, is_valid: true },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Case 8: Omar Al-Mazrouei — REFER_TO_EMPLOYEE
  // Employed, salary 42,710, married, 5 dependents, arrears 206,976 (32 months)
  // Current EMI 6,468. Very high arrears + obligations > 60%.
  // Justification mentions 50% salary going to bank loans.
  // ─────────────────────────────────────────────────────────────────────────────
  {
    application_id: 'MSZHP_100908',
    request_type: 'UPDATE_INSTALLMENT',
    deduct_from_salary: true,
    created_date: '2026-03-28T09:00:00Z',
    has_prior_active_request: false,
    beneficiary: {
      full_name: 'Omar Yousef Al-Mazrouei',
      full_name_ar: 'عمر يوسف المزروعي',
      emirates_id: '784-1980-6789012-6',
      customer_id: 'EDB_CUS_008234',
      marital_status: 'MARRIED',
      employment_status: 'EMPLOYED',
      location_emirate: 'Ajman',
      is_person_of_determination: false,
    },
    family: {
      dependents_count: 5,
      total_family_members: 7,
    },
    income: {
      current_salary: 42710,
      salary_trend: 'STABLE',
      income_source: 'Government',
      total_obligations: 27762,
      obligations_to_income_ratio: 0.65,
    },
    loan: {
      agreement_id: 'MAGREE_18923',
      edb_loan_id: 'EDB_LN_48392',
      original_loan_amount: 1100000,
      remaining_balance: 780000,
      original_period_months: 300,
      remaining_period_months: 180,
      current_emi: 6468,
      payment_history_summary: 'Highly irregular for past 32 months; multiple partial payments.',
    },
    arrears: {
      overdue_amount: 206976,
      overdue_months: 32,
      reason_for_delay: 'أكثر من 50% من راتبي يذهب لسداد قروض البنوك. أحتاج إلى إعادة جدولة عاجلة.',
      supporting_documents: [
        { name: 'salary_certificate_2026.pdf', type: 'SALARY_CERTIFICATE', is_stamped: true, is_valid: true },
        { name: 'bank_statement_ajman.pdf', type: 'BANK_STATEMENT', is_stamped: true, is_valid: true },
        { name: 'aecb_high_liability_report.pdf', type: 'OTHER', is_stamped: true, is_valid: true },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Case 9: Layla Al-Ketbi — REJECT (prior active request)
  // Employed, salary 20,500, single, 0 dependents (1 family)
  // Arrears 57,525 (25 months), current EMI 2,301
  // Has prior active request → REJECT
  // ─────────────────────────────────────────────────────────────────────────────
  {
    application_id: 'MSZHP_101009',
    request_type: 'UPDATE_INSTALLMENT',
    deduct_from_salary: true,
    created_date: '2026-05-15T12:00:00Z',
    has_prior_active_request: true,
    beneficiary: {
      full_name: 'Layla Rashid Al-Ketbi',
      full_name_ar: 'ليلى راشد الكتبي',
      emirates_id: '784-1993-7890123-4',
      customer_id: 'EDB_CUS_009567',
      marital_status: 'SINGLE',
      employment_status: 'EMPLOYED',
      location_emirate: 'Dubai',
      is_person_of_determination: false,
    },
    family: {
      dependents_count: 0,
      total_family_members: 1,
    },
    income: {
      current_salary: 20500,
      salary_trend: 'STABLE',
      income_source: 'Private Sector',
      total_obligations: 8200,
      obligations_to_income_ratio: 0.40,
    },
    loan: {
      agreement_id: 'MAGREE_40126',
      edb_loan_id: 'EDB_LN_92584',
      original_loan_amount: 500000,
      remaining_balance: 345000,
      original_period_months: 240,
      remaining_period_months: 132,
      current_emi: 2301,
      payment_history_summary: 'Irregular payments for 25 months. Prior rescheduling request still active.',
    },
    arrears: {
      overdue_amount: 57525,
      overdue_months: 25,
      reason_for_delay: 'مشاكل مالية مستمرة بسبب عدم استقرار الوظيفة.',
      supporting_documents: [
        { name: 'salary_certificate_2026.pdf', type: 'SALARY_CERTIFICATE', is_stamped: true, is_valid: true },
        { name: 'bank_statement_dubai.pdf', type: 'BANK_STATEMENT', is_stamped: true, is_valid: true },
        { name: 'aecb_liability_report.pdf', type: 'OTHER', is_stamped: true, is_valid: true },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Case 10: Sultan Al-Rashidi — Conservative plan, borderline REFER
  // Employed, salary 13,499, married, 6 dependents (8 family)
  // Arrears 46,676 (28 months), current EMI 1,667, salary decreased
  // Income per member < 2500, UPDATE_INSTALLMENT
  // ─────────────────────────────────────────────────────────────────────────────
  {
    application_id: 'MSZHP_101110',
    request_type: 'UPDATE_INSTALLMENT',
    deduct_from_salary: true,
    created_date: '2026-04-12T15:45:00Z',
    has_prior_active_request: false,
    beneficiary: {
      full_name: 'Sultan Hamad Al-Rashidi',
      full_name_ar: 'سلطان حمد الراشدي',
      emirates_id: '784-1977-8901234-8',
      customer_id: 'EDB_CUS_010892',
      marital_status: 'MARRIED',
      employment_status: 'EMPLOYED',
      location_emirate: 'Umm Al Quwain',
      is_person_of_determination: false,
    },
    family: {
      dependents_count: 6,
      total_family_members: 8,
    },
    income: {
      current_salary: 13499,
      salary_trend: 'DECREASED',
      income_source: 'Government',
      total_obligations: 6800,
      obligations_to_income_ratio: 0.50,
    },
    loan: {
      agreement_id: 'MAGREE_12078',
      edb_loan_id: 'EDB_LN_35671',
      original_loan_amount: 550000,
      remaining_balance: 410000,
      original_period_months: 360,
      remaining_period_months: 240,
      current_emi: 1667,
      payment_history_summary: 'Payments became irregular 28 months ago following salary reduction.',
    },
    arrears: {
      overdue_amount: 46676,
      overdue_months: 28,
      reason_for_delay: 'تم تخفيض راتبي ولدي 6 أبناء في مراحل التعليم المختلفة. أحتاج المساعدة.',
      supporting_documents: [
        { name: 'salary_certificate_2026.pdf', type: 'SALARY_CERTIFICATE', is_stamped: true, is_valid: true },
        { name: 'bank_statement_uaq.pdf', type: 'BANK_STATEMENT', is_stamped: true, is_valid: true },
        { name: 'family_book_copy.pdf', type: 'OTHER', is_stamped: true, is_valid: true },
        { name: 'school_enrollment_certificates.pdf', type: 'OTHER', is_stamped: true, is_valid: true },
      ],
    },
  },
];
