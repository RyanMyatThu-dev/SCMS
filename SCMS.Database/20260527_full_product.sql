-- Idempotent schema additions for the SCMS Blazor WASM full product.

CREATE TABLE IF NOT EXISTS tbl_prescription_template (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    disease_id INT NOT NULL REFERENCES tbl_disease(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    delete_flag BOOLEAN
);

CREATE TABLE IF NOT EXISTS tbl_prescription_template_item (
    id SERIAL PRIMARY KEY,
    template_id INT NOT NULL REFERENCES tbl_prescription_template(id) ON DELETE CASCADE,
    medicine_id INT NOT NULL REFERENCES tbl_medicine(medicine_id),
    dosage VARCHAR(100),
    days INT NOT NULL,
    quantity INT NOT NULL,
    instruction TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delete_flag BOOLEAN
);

CREATE TABLE IF NOT EXISTS tbl_lab_report (
    id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES tbl_patient(patient_id),
    appointment_id INT REFERENCES tbl_appointment(id) ON DELETE SET NULL,
    prescription_id INT REFERENCES tbl_prescription(id) ON DELETE SET NULL,
    test_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    result_summary TEXT,
    attachment_url VARCHAR(500),
    due_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    delete_flag BOOLEAN
);

CREATE TABLE IF NOT EXISTS tbl_follow_up (
    id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES tbl_patient(patient_id),
    appointment_id INT REFERENCES tbl_appointment(id) ON DELETE SET NULL,
    prescription_id INT REFERENCES tbl_prescription(id) ON DELETE SET NULL,
    due_at TIMESTAMP NOT NULL,
    recommendation TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    delete_flag BOOLEAN
);

COMMENT ON COLUMN tbl_user_role.role IS 'admin / doctor / patient / user';
COMMENT ON COLUMN tbl_lab_report.status IS 'requested / completed';
COMMENT ON COLUMN tbl_follow_up.status IS 'pending / completed';
