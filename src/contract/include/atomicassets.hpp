/*
This file is not used for the actual atomicassets contract.
It can be used as a header file for other contracts to access the atomicassets
tables and custom data types.
*/

#include <eosio/eosio.hpp>
#include <eosio/asset.hpp>

using namespace eosio;
using namespace std;

namespace atomicassets {
    static constexpr name ATOMICASSETS_ACCOUNT = name("atomicassets");

    // Custom vector types need to be defined because otherwise a bug in the ABI
    // serialization would cause the ABI to be invalid
    typedef std::vector<int8_t> INT8_VEC;
    typedef std::vector<int16_t> INT16_VEC;
    typedef std::vector<int32_t> INT32_VEC;
    typedef std::vector<int64_t> INT64_VEC;
    typedef std::vector<uint8_t> UINT8_VEC;
    typedef std::vector<uint16_t> UINT16_VEC;
    typedef std::vector<uint32_t> UINT32_VEC;
    typedef std::vector<uint64_t> UINT64_VEC;
    typedef std::vector<float> FLOAT_VEC;
    typedef std::vector<double> DOUBLE_VEC;
    typedef std::vector<std::string> STRING_VEC;

    typedef std::variant<int8_t, int16_t, int32_t, int64_t, uint8_t, uint16_t, uint32_t,
                         uint64_t, float, double, std::string, INT8_VEC, INT16_VEC, INT32_VEC,
                         INT64_VEC, UINT8_VEC, UINT16_VEC, UINT32_VEC, UINT64_VEC, FLOAT_VEC,
                         DOUBLE_VEC, STRING_VEC>
        ATOMIC_ATTRIBUTE;

    typedef std::map<std::string, ATOMIC_ATTRIBUTE> ATTRIBUTE_MAP;

    struct FORMAT {
        string name;
        string type;
    };

    // Scope: owner
    struct assets_s {
        uint64_t asset_id;
        name collection_name;
        name schema_name;
        int32_t template_id;
        name ram_payer;
        vector<asset> backed_tokens;
        vector<uint8_t> immutable_serialized_data;
        vector<uint8_t> mutable_serialized_data;

        uint64_t primary_key() const {
            return asset_id;
        };
    };

    typedef multi_index<name("assets"), assets_s> assets_t;

    assets_t get_assets(name acc) {
        return assets_t(ATOMICASSETS_ACCOUNT, acc.value);
    }
}; // namespace atomicassets
