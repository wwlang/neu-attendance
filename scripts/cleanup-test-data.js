// ====== CLEANUP SCRIPT - RUN IN BROWSER CONSOLE ======
// First, sign in as an instructor at https://wwlang.github.io/neu-attendance/
// Then paste this entire script in the console

(async function cleanupTestData() {
  const testSessionIds = ["mkmxdhmq", "mkmxdhru", "mkmxdhrv", "mkmxdhss", "mkmxdht8", "mkmxdi20", "mkmxdi81", "mkmxdkz4", "mkmxdl54", "mkmxdlem", "mkmxdlfb", "mkmxdlji", "mkmxdlot", "mkmxdmrx", "mkmxduxq", "mkmxe39g", "mkmxe8jh", "mkmxe8nn", "mkmxe8z8", "mkmxeayr", "mkmxegel", "mkmxet3b", "mkmxexnm", "mkmxexuu", "mkmxok7j", "mkmxok8g", "mkmxokce", "mkmxokgr", "mkmxokj4", "mkmxokxo", "mkmxontu", "mkmxonus", "mkmxoo7q", "mkmxooh8", "mkmxook0", "mkmxoprj", "mkmxox29", "mkmxp6fa", "mkmxpbdj", "mkmxpbjs", "mkmxpbsc", "mkmxpf25", "mkmxpkm6", "mkmxpyst", "mkmxq1ar", "mkmxq2nl", "mkmxqrbr", "mkmxr5gg", "mkmxre49", "mkmxrmr5", "mkmxrve1", "mkmxs60w", "mkmxshd0", "mkmxsuyo", "mkmxt7y2", "mkmxtm56", "mkmxtxxs", "mkmxucjy", "mkmyds1y", "mkmydsgj", "mkmydsn9", "mkmydspb", "mkmydsq9", "mkmydsqh", "mkmydtci", "mkmydtvx", "mkmydu1x", "mkmydu5n", "mkmydu9t", "mkmyduay", "mkmyduew", "mkmydufl", "mkmydv8z", "mkmye77b", "mkmye7db", "mkmye7sd", "mkmye912", "mkmyeifp", "mkmyel5v", "mkmyemau", "mkmyemge", "mkmyf77u", "mkmyf7ad", "mkmyf7fy", "mkmyf7lq", "mkmyf7mn", "mkmyf7nt", "mkmyf7rr", "mkmyf8pr", "mkmyf8wp", "mkmyf8zq", "mkmyf94l", "mkmyf9n3", "mkmyf9o1", "mkmyf9qt", "mkmyfano", "mkmyflxp", "mkmyfm84", "mkmyfm9i", "mkmyfn88", "mkmyfo6p", "mkmyfx4p", "mkmyg059", "mkmyg1ck", "mkmyg1dp", "mkmygm6s", "mkmygm9t", "mkmygmfc", "mkmygmng", "mkmygmod", "mkmygmrm", "mkmygmys", "mkmygnoa", "mkmygo32", "mkmygocs", "mkmygodh", "mkmygoen", "mkmygofk", "mkmygozp", "mkmygp37", "mkmyh111", "mkmyh18p", "mkmyh1fv", "mkmyh1ta", "mkmyh319", "mkmyhbyb", "mkmyhehr", "mkmyhfen", "mkmyhfik", "mkmyivoc", "mkmyivp9", "mkmyivpa", "mkmyivpi", "mkmyivvr", "mkmyivzg", "mkmyiwr9", "mkmyiwxi", "mkmyiwye", "mkmyix3q", "mkmyix9r", "mkmyix9z", "mkmyixe5", "mkmyiy7b", "mkmyj9xb", "mkmyja49", "mkmyjae7", "mkmyjbd5", "mkmyjknv", "mkmyjnkr", "mkmyjp8x", "mkmyjp9m", "mkmyka7s", "mkmykaak", "mkmykabp", "mkmykag3", "mkmykaqa", "mkmykbfa", "mkmykbg8", "mkmykbtn", "mkmykc65", "mkmykc8g", "mkmykcac", "mkmykcni", "mkmykd69", "mkmykoit", "mkmykowy", "mkmykpje", "mkmykqz0", "mkmykzu8", "mkmyl1u5", "mkmyl2st", "mkmyl2xo", "mkmymack", "mkmymak5", "mkmymaod", "mkmymayz", "mkmymb3m", "mkmymb7b", "mkmymbfv", "mkmymcb4", "mkmymcbt", "mkmymcci", "mkmymck5", "mkmymcmy", "mkmymcrk", "mkmymdk1", "mkmymg5b", "mkmympjr", "mkmympwy", "mkmympxv", "mkmymq2q", "mkmymrp2", "mkmyn0v5", "mkmyn3rs", "mkmyn4lv", "mkmyn538", "mkmynr6d", "mkmynr7b", "mkmynrmc", "mkmynrp4", "mkmynrq2", "mkmyns2b", "mkmynsfq", "mkmynst6", "mkmynswn", "mkmynsyq", "mkmynt88", "mkmyntar", "mkmyntin", "mkmyntjk", "mkmynuia", "mkmyo66w", "mkmyo6nb", "mkmyo732", "mkmyo7sr", "mkmyo8ju", "mkmyohia", "mkmyokt9", "mkmyolli", "mkmyoloi", "mkmyqko3", "mkmyqktu", "mkmyql3t", "mkmyqla2", "mkmyqlf6", "mkmyqm0w", "mkmyqm99", "mkmyqmbc", "mkmyqmfy", "mkmyqmsx", "mkmyqmtm", "mkmyqmvy", "mkmyqn2n", "mkmyqnty", "mkmyqzls", "mkmyqztg", "mkmyr05p", "mkmyr1ok", "mkmyrakx", "mkmyrdj7", "mkmyreil", "mkmyrf4l", "mkmyuv1o", "mkmyuv5l", "mkmyuv92", "mkmyuvdh", "mkmyuvfb", "mkmyuvfj", "mkmyuw1r", "mkmyuwv5", "mkmyuy6u", "mkmyuye1", "mkmyuylg", "mkmyvsyq", "mkmyvt57", "mkmyvt7a", "mkmyvtg2", "mkmyvtpc", "mkmyvtq9", "mkmyvumo", "mkmyvvzz", "mkmyvwjn", "mkmyvwli", "mkmywxdd", "mkmywxe1", "mkmywxei", "mkmywxhq", "mkmywxrx", "mkmywxtj", "mkmywy5c", "mkmywz35", "mkmyx0bl", "mkmyx0ut", "mkmyx0wn", "mkmz2c6m", "mkmz2ca4", "mkmz2ccn", "mkmz2cgu", "mkmz2ck2", "mkmz2ded", "mkmz2e1s", "mkmz2fmy", "mkmz2fp1", "mkmz3hth", "mkmz3i1k", "mkmz3i9p", "mkmz3ial", "mkmz3iam", "mkmz3ipv", "mkmz3j55", "mkmz3jxv", "mkmz3l78", "mkmz3lpa", "mkmz5i86", "mkmz5idz", "mkmz5ino", "mkmz5ity", "mkmz5ix6", "mkmz5ix7", "mkmz5j2z", "mkmz5jvo", "mkmz5l9o", "mkmz5lnb", "mkmz6dah", "mkmz6dhe", "mkmz6dkn", "mkmz6doc", "mkmz6dpa", "mkmz6dzh", "mkmz6e1b", "mkmz6ewl", "mkmz6gbh", "mkmz6gey", "mkmz7yhl", "mkmz7yhu", "mkmz7ynu", "mkmz7yu4", "mkmz7ywf", "mkmz7yzw", "mkmz80bc", "mkmz81b8", "mkmz8l54", "mkmz8l7f", "mkmz8lbd", "mkmz8lvy", "mkmz8mj4", "mkmz8ny1", "mkmz8ol6", "mkmz971b", "mkmz973m", "mkmz974s", "mkmz975p", "mkmz97fo", "mkmz98si", "mkmz99vu", "mkmz99zc", "mkmz9pqp", "mkmz9puu", "mkmz9q36", "mkmz9q50", "mkmz9q5r", "mkmz9q6f", "mkmz9qwt", "mkmz9ruu", "mkmz9sxy", "mkmz9t01", "mkmza5ra", "mkmza5vq", "mkmza5y8", "mkmza5y9", "mkmza64i", "mkmza6aq", "mkmza6fl", "mkmza7mo", "mkmza8oe", "mkmza8re"];

  console.log("Starting cleanup of " + testSessionIds.length + " test sessions...");

  let deleted = 0;
  let failed = 0;

  for (const sessionId of testSessionIds) {
    try {
      // Delete session
      await firebase.database().ref("sessions/" + sessionId).remove();
      // Delete associated attendance
      await firebase.database().ref("attendance/" + sessionId).remove();
      // Delete associated failed attempts
      await firebase.database().ref("failed/" + sessionId).remove();
      // Delete associated audit records
      await firebase.database().ref("audit/" + sessionId).remove();
      deleted++;
      if (deleted % 50 === 0) {
        console.log("Progress: " + deleted + "/" + testSessionIds.length);
      }
    } catch (err) {
      console.error("Failed to delete " + sessionId + ": " + err.message);
      failed++;
    }
  }

  console.log("");
  console.log("=== CLEANUP COMPLETE ===");
  console.log("Deleted: " + deleted + " test sessions");
  console.log("Failed: " + failed);
  console.log("");
  console.log("Remaining sessions should only be real class data.");
})();
