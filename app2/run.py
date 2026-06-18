from app import create_app

app = create_app()

if __name__ == "__main__":
    # '0.0.0.0' tells Flask to listen on all available network interfaces
    app.run(host='0.0.0.0', port=5000, debug=True)