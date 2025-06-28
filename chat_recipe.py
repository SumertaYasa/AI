from google import genai

client = genai.Client(api_key="AIzaSyDXjiFMSEbgXkV2BfKKhYORPLkepEDuLNo")

# Prompt
CONTROL_INTRACTIONS = (
  "Kamu adalah chatbot resep masakan. "
  "Jawab hanya tentang resep, bahan masakan, dan cara memasak. "
  "Tolak semua pertanyaan yang tidak berkaitan dengan makanan."
)

while True:
  user_input = input("User: ")

  if user_input.lower() in ["terima kasih", "thx", "thank you"]:
    print("Bot: Terima kasih, sampai jumpa.")
    break

  prompt_final = CONTROL_INTRACTIONS + "\nUser" + user_input

  response = client.models.generate_content(
      model="gemini-2.0-flash", contents= prompt_final
  )

  print("Bot: " + response.text)


