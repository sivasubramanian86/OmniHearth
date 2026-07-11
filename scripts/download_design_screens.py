import urllib.request
import os

# Resolve path relative to script location
script_dir = os.path.dirname(os.path.abspath(__file__))
target_dir = os.path.join(script_dir, "..", "design_screens")
os.makedirs(target_dir, exist_ok=True)

screens = {
    "dashboard.png": "https://lh3.googleusercontent.com/aida/AP1WRLvEg9o4RTow20OxaK6ggSKoSCoX2K6JehAz9sXvVVOFFxV9MvKH6Rn7qYy4n8kUtFjGOgMzOFytuNPVmnPoCaAbqqXjQWCX7Aa-7__FlG2SV2WFckDM-d1FJhOTG4GHM2m9JM-BA4tZRTpfqv7nINLQ99XoEBwCgKM-_YSmzOLogRAJfLyLVZqDjxMM386aF_OyBZXtOIMRizvsNbiM27B6NTsb0uVu0rX8wVk8jSkeG28_eQnqpyQ-pwQh",
    "child_mode.png": "https://lh3.googleusercontent.com/aida/AP1WRLsioCL305u1xPQ1yyxxbonG3EphiB8dBMqxwDHWD5Xz0rE_5lVJB5t7pyh2YRX30eiDZ7JYpn5FuVRrSYvia6nQDuiBPFsKzC93JjcaKxxgu3ckx1L_BGLyaOQB9dYz_uRE6x1hFPj2t4L03_-gyrUjSfrYDYQ0RCgtzYmxhzHTFaJETxxiJSxzcZ-8WzLQ3fs0nxWpaxnLljNIw9yzH-R9c9mDrmhCjwhdTthLtrEogjG42dnDhxL7lV1i",
    "logistics.png": "https://lh3.googleusercontent.com/aida/AP1WRLtjCwUuX0EgjlhuLqNXsLQyaR6Y3MRmy8mV8OexV0JSU9p_B6oitYZ2iuczLlU5hE19jfaAx-TLJ-lrAU6ZrZ7-FJk85_TYu2jfces3g-BeTYY6Sx0pT0zFl92srdCDMHYYlVH8O44ANQox7ZSMvVSqtM8GW8g2h_rE6nQIhbJ9kAaZ1LptksZOpJ-q9gXFi-a7uK9zDQIzsOoF0M_CwCf4IL3RrXvkb-LGEzmdJsBLGxdyhp4BTEnGZgVn",
    "health_inventory.png": "https://lh3.googleusercontent.com/aida/AP1WRLtI6Wt0s-hv_pbZVvFofzrS2rJPsioxvsWTyx5srF4NGGynBlZgf9HGSdB-s6LmpBT_CAlHtvghPQ-TSoWCXH2AUVJS444xZQrOaQjiWRBIbujqsb0Mnoz3LU_f7wLpXsRSd7dELw3LXXVVG8Pu6fEOF6OdDfmG5yryQGaqQ82WzHkU8nL4JDmzE5EU8SzbIzL227MM4gdk5FU5vUSIYc_kYVN8tR55OvE0566vsEGnOgXhkcwLBpKpQHhy",
    "legacy_vault.png": "https://lh3.googleusercontent.com/aida/AP1WRLss5MyMG6SLvygaXV-5qKHPLHJjvRQb8UKd-W9al2Xp1hR52q0DmRBB0iXWD85bbwQsqR7d_PaqsCt9WtgBrj_qNA3-O4U_qNVuoE0_r90znbT8xLCU1nuzdRJEXmDxmjMdelXaAhAdBeC7W24QCMde4m6RgbLKTJWCZbitVZ0lAHlTKThT4EpPadLV_UXp0UuSmmkST6jReZfUg_LEm-Ri5DEIXVRyv3M1r_TsUqcOQBgx0BQ67tmjXDVJ",
    "faq_support.png": "https://lh3.googleusercontent.com/aida/AP1WRLstBdaXt2lzQSF2aew-kSvjYMZNha8fchagmgOA_TqbfRwKPG_nARQb23qyv7oVh8IT1dc5507AE5Ev8Y7HZ5hlfHvneaA7Ixl93FinP_uZ4uSswaPygJwn28TsCegh0WVDrwLpOsYBPZcDVfoqRZB64A-CZuHfK1RwdCpHA9Epm5hg--NRhRaLHRw016z-rFnwlOzHanoQ5BQKj7kvVGYIQLCThzo-pOvowYgmv-jLRfhooa9RxpNbh4oy",
    "about_mission.png": "https://lh3.googleusercontent.com/aida/AP1WRLunQ0175YBJz8u6dryCihSez0VCe-6jqUpDjGCulbMus8ZYrwkU_VDVYONEhzwMBZltRYy7JxNubMSbxMmx3glT62ku4Ii3TTnTGYc2CcxPvW0E3LBuV2Bmt5tPKK73feOpYEEPkiiTYArg5yupIbRKYM5pwipwdY1dJgW723vV75P8AAbO46dljVjxyV6NEkuXjxQA8uSPqcUjUUIpv64hCkRSyEZ9jF6U2Gcfmkpu4tYo3P_2pY8PJ-fQ",
    "settings_hub.png": "https://lh3.googleusercontent.com/aida/AP1WRLvVPFY6oz8eqU1R-kxeB--wHspKAJla0Lf4wXQhuSBTYAP-3OR_m7DE1oXEsG4-uOOrMMvtehOCpajY_1Hcshu19XxIFuARk6_lF70C7tYXhfQB2861etElW8MuRs-R5IXjeA1Lgyy1dy_YYfGGQbOLe8Kg6c0D02QRxMHVuLBtC4n0iMneLWkECa1HNZHSUFO3rS4EJnikf7ExnXj3xHroeIHUyDxlWAZzNyb_vyEHfAJq-5IUj2bxecMG"
}

print("Starting Stitch Design Screens download...")
for filename, url in screens.items():
    path = os.path.join(target_dir, filename)
    try:
        print(f"Downloading {filename}...")
        urllib.request.urlretrieve(url, path)
        print(f"Saved to {path}")
    except Exception as e:
        print(f"Failed to download {filename}: {e}")

print("Download complete.")
