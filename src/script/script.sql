create table role (
  role_id char (1) primary key,
  role_name varchar(10),
  role_code varchar(5),
  role_description varchar(50)
);

create table users (
  user_id SERIAL primary key,
  user_name varchar(50) null,
  full_name varchar(50) not null,     
  email varchar(50) unique not null,
  password varchar(200) not null,
  phone char(10),
  role_id char(1) default '1',
  address varchar(100),
  status varchar(10) default 'active',
  created_at timestamptz default now(),
  CONSTRAINT FK_user_role FOREIGN KEY (role_id) REFERENCES role(role_id)
);



CREATE TABLE otp_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) unique NOT NULL,
    otp VARCHAR(10) NOT NULL,
    otp_expiry TIMESTAMP  DEFAULT (NOW() + INTERVAL '2 minutes'),
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO role (role_id, role_name, role_code, role_description)
VALUES
('0', 'Admin', 'ADM', 'Toàn quyền hệ thống'),
('1', 'Reader', 'RED', 'Người dùng đọc nội dung'),
('2', 'Uploader', 'UPL', 'Người tải và quản lý truyện');