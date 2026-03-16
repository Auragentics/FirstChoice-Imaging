from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ghl_api_token: str
    ghl_location_id: str
    ghl_api_base: str = "https://services.leadconnectorhq.com"
    retell_webhook_secret: str = ""
    staff_email: str = "orders@firstchoice-imaging.com"
    staff_email_from: str = "noreply@firstchoice-imaging.com"
    log_level: str = "INFO"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
