import sys
import json
import simplemma
import unicodedata2
sys.stdout.reconfigure(encoding='utf-8')
sys.stdin.reconfigure(encoding='utf-8')

custom_lemmas = {
  "мені": "я",
  "розпатлане": "розпатлане" 
}
def remove_diacritics(text):
    # Normalize the text to decompose characters into base + diacritics
    nfkd_form = unicodedata2.normalize('NFKD', text)
    # Filter out diacritics but preserve `й`
    return ''.join(
        char if char == 'й' or not unicodedata2.combining(char) else '' 
        for char in nfkd_form
    )
  
def lemmatize_word(word):
    l1 = simplemma.lemmatize(word, lang='uk')
    final_lemma = custom_lemmas.get(word, l1)
    return remove_diacritics(final_lemma)
  
def lemmatize_map(word_count_list):
  lemmatized_map = {}

  for word, count in word_count_list:
      lemmatized_word = lemmatize_word(word)
      
      lemmatized_map[lemmatized_word] = lemmatized_map.get(lemmatized_word, 0) + int(count)
  sorted_dict = dict(sorted(lemmatized_map.items(), key=lambda item: item[1], reverse=True))
  return sorted_dict

if __name__ == "__main__":
    try:
      input_data = sys.stdin.read().strip()
      word_count_list = json.loads(input_data)
      result = lemmatize_map(word_count_list)
      json_result = json.dumps(result, ensure_ascii=False, indent=2)
      sys.stdout.write(json_result)
      sys.stdout.flush()
      
    except Exception as e:
        print(f"Error processing input data: {str(e)}", file=sys.stderr)
        sys.exit(1)