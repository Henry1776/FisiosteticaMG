@echo off
echo Creating database and tables...
C:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe -u root booking_system < database\schema.sql
echo.
echo Setting up admin user...
C:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe -u root booking_system < scripts\setup_admin.sql
echo.
echo Database setup complete!
pause
