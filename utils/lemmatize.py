import sys
# sys.stdout.flush()
import simplemma

import sys

# Set the encoding to UTF-8
sys.stdout.reconfigure(encoding='utf-8')
from lemmagen3 import Lemmatizer
# lem_uk = Lemmatizer("uk")

def lemmatize_word(word):
    # print("Starting python lemmatizer")
    l1 = simplemma.lemmatize(word, lang='uk')
    # l2 = lem_uk(word)
    
    # if l1 != l2:
    #   print(l1, l2)
    # sys.stdout.buffer.write(l1.encode('utf-8') + b'\n')
    print(l1)
    return l1

word = sys.argv[1]
if word:
  lemmatize_word(word)