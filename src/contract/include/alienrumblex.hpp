#include <atomicassets.hpp>
#include <eosio/asset.hpp>
#include <eosio/eosio.hpp>
#include <eosio/permission.hpp>
#include <eosio/singleton.hpp>
#include <eosio/transaction.hpp>

using namespace eosio;
using namespace std;

CONTRACT alienrumblex : public contract {
    static constexpr eosio::symbol TLM_SYMBOL = symbol("TLM", 4);
    static constexpr eosio::name TLM_CONTRACT = name("alien.worlds");

  public:
    using contract::contract;

    // contract actions
    ACTION setweaponcnf(const uint64_t &template_id, const string &weapon_class,
                        const uint8_t &attack, const uint8_t &defense);
    ACTION setcrewcnf(const uint64_t &template_id, const string &race, const string &element,
                      const uint8_t &attack, const uint8_t &defense);
    ACTION setarena(const name &arena_name, const asset &cost, const uint8_t &fee);
    ACTION rmarena(const name &arena_name);
    ACTION startbattle(const name &arena_name);
    ACTION logwinner(const uint64_t &battle_id, const name &winner);

    // user actions
    ACTION regnewuser(const name &user);
    ACTION enterqueue(const name &user, const name &arena_name, const uint64_t &minion_id,
                      const uint64_t &weapon_id);
    ACTION withdraw(const name &user, const asset &quantity);

    // non-action functions
    void receive_tokens(name from, name to, asset quantity, string memo);

  private:
    // accounts table data struct
    TABLE account_entity {
        name account;
        asset balance;

        auto primary_key() const {
            return account.value;
        }
    };

    // arena data struct
    TABLE arena_entity {
        name name;
        asset cost;
        uint8_t fee;

        auto primary_key() const {
            return name.value;
        }
    };

    // weaponconf data struct
    TABLE weapon_conf_entity {
        uint64_t template_id;
        string weapon_class;
        uint8_t attack;
        uint8_t defense;

        auto primary_key() const {
            return template_id;
        }
    };

    // crewconf data struct
    TABLE crew_conf_entity {
        uint64_t template_id;
        string race;
        string element;
        uint8_t attack;
        uint8_t defense;

        auto primary_key() const {
            return template_id;
        }
    };

    // queue data struct
    TABLE queue_entity {
        name player;
        name arena_name;
        uint64_t minion_id;
        uint64_t weapon_id;

        auto primary_key() const {
            return player.value;
        }
    };

    // battle data struct
    TABLE battle_entity {
        uint64_t battle_id;
        name arena_name;
        vector<name> players;
        name winner;

        auto primary_key() const {
            return battle_id;
        }

        uint64_t secondary_key() const {
            return arena_name.value;
        }

        uint64_t tertiary_key() const {
            return winner.value;
        }
    };

    typedef multi_index<name("accounts"), account_entity> accounts_table;
    typedef multi_index<name("weaponconf"), weapon_conf_entity> weapons_conf_table;
    typedef multi_index<name("crewconf"), crew_conf_entity> crews_conf_table;
    typedef multi_index<name("arenas"), arena_entity> arenas_table;
    typedef multi_index<name("queues"), queue_entity> queues_table;
    typedef multi_index<name("battles"), battle_entity> battles_table;

    // helper functions
    accounts_table::const_iterator check_user_registered(const name &user);
    void check_user_weapon(const name &user, const uint64_t &asset_id);
    void check_user_crew(const name &user, const uint64_t &asset_id);
    uint64_t tx_rand(const uint64_t &upper_limit);

    // getter functions
    accounts_table get_accounts();
    weapons_conf_table get_weapons_conf();
    crews_conf_table get_crews_conf();
    arenas_table get_arenas();
    queues_table get_queues();
    battles_table get_battles();
};
