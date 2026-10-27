-- Extra database used by the Node.js backend's test suite.
CREATE DATABASE IF NOT EXISTS orderdesk_test;
GRANT ALL PRIVILEGES ON orderdesk_test.* TO 'orderdesk'@'%';
