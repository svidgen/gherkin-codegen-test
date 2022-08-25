package com.example.androidcpktesting

import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import com.amplifyframework.AmplifyException
import com.amplifyframework.api.ApiPlugin
import com.amplifyframework.core.Amplify
import com.amplifyframework.core.model.Model
import com.amplifyframework.core.model.query.ObserveQueryOptions
import com.amplifyframework.core.model.query.QueryOptions
import com.amplifyframework.core.model.query.Where
import com.amplifyframework.core.model.query.predicate.QueryPredicate
import com.amplifyframework.api.aws.AWSApiPlugin
import com.amplifyframework.api.aws.GsonVariablesSerializer
import com.amplifyframework.api.graphql.SimpleGraphQLRequest
import com.amplifyframework.api.graphql.model.ModelMutation
import com.amplifyframework.datastore.AWSDataStorePlugin
import com.amplifyframework.datastore.DataStoreConfiguration
import com.amplifyframework.datastore.generated.model.Project
import com.amplifyframework.datastore.generated.model.Team
import com.amplifyframework.hub.AWSHubPlugin
import kotlinx.coroutines.*
import java.lang.Exception
import java.util.*
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

class MainActivity : AppCompatActivity() {

    /**
     * Executes a given story and logs output about whether the case succeeded or failed.
     *
     * @param story A description of the use-case.
     * @param action The code to execute to stress the testing story.
     * @param fastFollow Whether the test is expected to pass *right now*. "Fast follow"
     * essentially indicates that the failure is known, so the failure doesn't appear in
     * the logs with a full a trace. These failures are also marked as "KNOWN" errors
     * instead of "FAILED" stories.
     */
    private suspend fun test(
        story: String,
        action: suspend () -> Unit,
        isKnown: Boolean = false
    ) = coroutineScope {
        Log.i("Verbose", "PENDING : $story")
        try {
            action()
            Log.i("Story", "MET     : $story")
        } catch (error: Exception) {
            if (isKnown) {
                Log.e("Story", "KNOWN   : $story")
            } else {
                Log.e("Story", "FAILED  : $story", error)
            }
        } finally {
            // clear()
            Log.i("Verbose", "FINALLY : $story")
        }
    }

    private fun expect(expectation: String, isMet: Boolean) {
        when {
            isMet -> {
                Log.i("Expectation", "MET     : ${expectation}")
            }
            else -> {
                Log.e("Expectation", "FAILED  : ${expectation}")
                throw Exception("Expectation failed: ${expectation}")
            }
        }
    }

    private fun setTimeout(time: Long, f: () -> Unit): Job {
        return GlobalScope.launch {
            delay(time)
            f()
        }
    }

    private suspend fun <T>createWithAPI(item: T): T where T : Model {
        return suspendCoroutine { continuation ->
            try {
                Log.i("Verbose", "starting to create mutation")

                val baseMutation = ModelMutation.create(item)
                Log.i("Verbose", "mutation created: ${baseMutation}")

                val newValues = baseMutation.variables.toMutableMap()
                newValues.set("_version", "1")

                val customMutation = SimpleGraphQLRequest<T>(
                    baseMutation.query,
                    newValues,
                    item::class.java,
                    GsonVariablesSerializer()
                )

                Log.i(
                    "Verbose",
                    "new mutation: ${customMutation.query} -> ${customMutation.variables}"
                )

                Amplify.API.mutate(
                    customMutation,
                    {
                        Log.i("Verbose", "created ${item}")
                        continuation.resume(it.data)
                    },
                    {
                        Log.e("Verbose", "failed to create ${item}", it)
                        continuation.resumeWithException(it)
                    }
                )
            } catch (error: Exception) {
                Log.e("Verbose", "could not create mutation for ${item}", error)
                continuation.resumeWithException(error)
            }
        }
    }

    private suspend fun <T>save(item: T): T where T : Model {
        /**
         * This construction essentially turns a callback into a `deferred`
         * object, which can be `.await()`-ed in a coroutine.
         *
         * Does DataStore already provide a `deferred` interface?
         * It looks like this should do it:
         *
         * https://ds-custom-pk.d1oosfztpocl9c.amplifyapp.com/lib/project-setup/coroutines/q/platform/android/
         *
         * TODO: Try this out as part of Android CPK testing ... Still exploring.
         */
        Log.i("Tutorial", "inside save ... ${item.toString()}")
        return suspendCoroutine { continuation ->
            Log.i("Tutorial", "inside save continuation ... ${item.toString()}")
            Amplify.DataStore.save(item,
                {
                    Log.i("Tutorial", "saved item: ${item.toString()}")
                    continuation.resume(it.item())
                },
                {
                    Log.e("Tutorial", "Failed to save item: ${item.toString()}")
                    continuation.resumeWithException(it)
                }
            )
            Log.i("Tutorial", "after save continuation ... ${item.toString()}")
        }
    }

    private suspend fun <T>get(model: Class<T>, options: QueryOptions): T? where T : Model {
        return suspendCoroutine { continuation ->
            Amplify.DataStore.query(model, options,
                {
                    val items = it.asSequence().toList()
                    when {
                        items.size == 1 -> {
                            continuation.resume(items.first())
                        }
                        items.isEmpty() -> {
                            continuation.resume(null)
                        }
                        else -> {
                            continuation.resumeWithException(Error("Multiple items found for get()"))
                        }
                    }
                },
                {
                    Log.e("Tutorial", "get() couldn't get the thing", it)
                    continuation.resumeWithException(it)
                }
            )
        }
    }

    /**
     * @param instance An instance to re-fetch from local storage.
     */
    private suspend fun <T>get(instance: T): T? where T : Model {
        return suspendCoroutine { continuation ->
            Amplify.DataStore.query(
                instance::class.java,
                Where.identifier(instance::class.java, instance.resolveIdentifier()),
                {
                    val items = it.asSequence().toList()
                    when {
                        items.size == 1 -> {
                            continuation.resume(items.first())
                        }
                        items.isEmpty() -> {
                            continuation.resume(null)
                        }
                        else -> {
                            continuation.resumeWithException(Error("Multiple items found for get(instance)"))
                        }
                    }
                },
                { Log.e("Tutorial", "get(instance) couldn't get the thing", it)}
            )
        }
    }

    private suspend fun <T>list(model: Class<T>, options: QueryOptions? = null): List<T> where T : Model {
        // val field = model::class.members.find { it -> it.name == "abc"}
        return suspendCoroutine { continuation ->
            Amplify.DataStore.query(
                model,
                options ?: Where.matchesAll(),
                { continuation.resume(it.asSequence().toList()) },
                {
                    Log.e("Tutorial", "couldn't get the thing 6", it)
                    continuation.resumeWithException(it)
                }
            )
        }
    }

    private suspend fun <T>delete(item: T): T where T : Model {
        return suspendCoroutine { continuation ->
            Amplify.DataStore.delete(
                item,
                { continuation.resume(it.item()) },
                {
                    Log.e("Tutorial", "delete() failure", it)
                    continuation.resumeWithException(it)
                }
            )
        }
    }

    private suspend fun <T>delete(model: Class<T>, predicate: QueryPredicate): Unit where T : Model {
        return suspendCoroutine { continuation ->
            Amplify.DataStore.delete(
                model,
                predicate,
                { continuation.resume(Unit) },
                {
                    Log.e("Tutorial", "delete() failure", it)
                    continuation.resumeWithException(it)
                }
            )
        }
    }

    private suspend fun <T>waitForObservedRecord(model: Class<T>, predicate: QueryPredicate, timeout: Long = 3000):
            T where T : Model = suspendCoroutine { continuation ->

        var canceled = false;

        var unsubscribe = {
            Log.e("Tutorial", "subscription NOT canceled")
        }

        setTimeout(timeout) {
            if (!canceled) {
                unsubscribe()
                continuation.resumeWithException(Exception("Observe event did not arrive prior to timeout"))
            }
        }

        Amplify.DataStore.observe(
            model,
            predicate,

            // on start -> Cancelable
            {
                unsubscribe = {
                    canceled = true
                    it.cancel()
                    Log.i("Tutorial", "unsubscribed")
                }
                Log.i("Tutorial", "subscription established")
            },

            // on item change
            {
                Log.i("Tutorial", "on item change $it")
                unsubscribe()
                continuation.resume(it.item())
            },

            // on failure
            {
                Log.e("Tutorial", "on failure", it)
                unsubscribe()
                continuation.resumeWithException(it)
            },

            // on complete
            { Log.i("Tutorial", "on failure")},
        )
    }

    private suspend fun <T>observeQueryForTime(
        model: Class<T>,
        predicate: QueryPredicate,
        time: Long
    ): List<List<T>> where T : Model = suspendCoroutine { continuation ->
        var unsubscribe = {
            Log.e("Tutorial", "subscription NOT canceled")
        }

        var snapshots = ArrayList<List<T>>();

        setTimeout(time) {
            unsubscribe()
            continuation.resume(snapshots)
        }

        Amplify.DataStore.observeQuery(
            model,
            ObserveQueryOptions().matches(predicate),

            // on start -> Cancelable
            {
                unsubscribe = {
                    it.cancel()
                    Log.i("Tutorial", "unsubscribed")
                }
                Log.i("Tutorial", "subscription established")
            },

            // on snapshot
            {
                Log.i("Tutorial", "on items received $it")
                snapshots.add(it.items)
            },

            // on failure
            {
                Log.e("Tutorial", "on failure", it)
                unsubscribe()
                continuation.resumeWithException(it)
            },

            // on complete
            { Log.i("Tutorial", "on failure")},
        )
    }

    private suspend fun clear(): Boolean {
        return suspendCoroutine { continuation ->
            Amplify.DataStore.clear(
                {
                    Log.i("Tutorial", "DataStore cleared")
                    continuation.resume(true)
                },
                {
                    Log.e("Tutorial", "Failed to clear", it)
                    continuation.resumeWithException(it)
                }
            )
        }
    }

            Project.PROJECT_ID.eq(project.projectId),
            10000
        )}

        createWithAPI(project)

        expect(
            "we have observed the project creation",
            observation.await() != null
        )
        expect(
            "we have observed the correct project creation",
            observation.await().projectId == project.projectId
        )
    }

    suspend fun canObserveTeamCreateFromAnotherClient() = coroutineScope {
        val project = createWithAPI(Project.builder()
            .projectId(UUID.randomUUID().toString())
            .name("canObserveTeamCreateFromAnotherClient name")
            .build())

        val team = Team.builder()
            .teamId(UUID.randomUUID().toString())
            .name("canObserveTeamCreateFromAnotherClient team")
            .project(project)
            .build()

        val observation = async { waitForObservedRecord(
            Team::class.java,
            Team.TEAM_ID.eq(team.teamId),
            10000
        )}

        createWithAPI(team)

        expect(
            "we have observed the team creation",
            observation.await() != null
        )
        expect(
            "we have observed the correct team creation",
            observation.await().teamId == team.teamId
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        try {
//            val config = DataStoreConfiguration.builder()
//                .errorHandler {
//                    Log.e("Tutorial", "errorHandler caught", it)
//                }
//                .build()
//
//            val dataStorePlugin = AWSDataStorePlugin.builder().dataStoreConfiguration(config).build()
//            Amplify.addPlugin(dataStorePlugin)

            Amplify.addPlugin(AWSHubPlugin())
            Amplify.addPlugin(AWSApiPlugin())
            Amplify.addPlugin(AWSDataStorePlugin())

            Amplify.configure(applicationContext)
            Log.i("Tutorial", "Initialized amplify app")
        } catch (failure: AmplifyException) {
            Log.e("Tutorial", "Could not initialize the app", failure)
        }

        Log.i("Tutorial", "Before coroutine scope")

        // GlobalScope.launch(Dispatchers.Default) {
        GlobalScope.async {
            Log.i("Tutorial", "at the top of the launch")

            // if/when we need to test behavior on a clean local database.
            // and when we need NOT to, just comment these three lines out:
//            clear()
//            delay(5000)
//            Log.i("Verbose", "Data cleared")

            // Basics
//            test("can create and retrieve a team with a project", ::canCreateAndRetrieve)
//            test("can create a team without a project", ::canCreateTeamWithoutProject)
//            test("can create a project with a team 'directly'", ::canCreateProjectWithTeamDirectly, true)
//            test("can create a project with a team", ::canCreateProjectWithTeam, true)
//            test("can query for all created projects", ::canQueryAll)
//            test("can delete a project", ::canDeleteProject)
//            test("can delete a team", ::canDeleteTeam)
//
//            // Project
//            test("can query for created projects by predicate", ::canQueryProjectBySimplePredicate)
//            test("can query for created projects by FK fields", ::canQueryProjectByTeamFKPredicate)
//            test("can query for created projects by cluster key alone", ::canQueryProjectByClusterKeyAlone)
//            test("can query for created projects by sort key alone", ::canQueryProjectBySortKeyAlone)
//            test("can update created project FK fields", ::canUpdateProjectFKFields)
//            test("can delete created project by PK", ::canDeleteProjectByPK)
//            test("can delete created project by cluster key", ::canDeleteProjectByClusterKeyAlone)
//            test("can delete created project by sort key", ::canDeleteProjectBySortKeyAlone)
//            test("can delete created project by FK fields", ::canDeleteProjectByTeamFK)
//
//            // Project (hasOne) predicate doesn't provide a `.TEAM` matcher, so we only have one
//            // test case for each of create,update + observe,observeQuery
//            test("can observe a project creation by team FK", ::canObserveProjectCreateByFK)
//            test("can observe a project update by team FK", ::canObserveProjectUpdateByFK)
//            test("can observeQuery a project create by team FK", ::canObserveQueryProjectCreateByFK)
//            test("can observeQuery a project update by team FK", ::canObserveQueryProjectUpdateByFK)
//
//            // Team
//            test("can query for created teams by predicate", ::canQueryTeamBySimplePredicate)
//            test("can query for created teams by FK fields", ::canQueryTeamByProjectFKPredicate, true)
//            test("can query for created teams by project predicate with PK matcher", ::canQueryTeamByProjectPKPredicate)
//            test("can query for created teams by cluster key alone", ::canQueryTeamByClusterKeyAlone)
//            test("can query for created teams by sort key alone", ::canQueryTeamBySortKeyAlone)
//            test("can update created team FK fields", ::canUpdateTeamFKFields)
//            test("can delete created team by PK", ::canDeleteTeamByPK)
//            test("can delete created team by cluster key", ::canDeleteTeamByClusterKeyAlone)
//            test("can delete created team by sort key", ::canDeleteTeamBySortKeyAlone)
//            test("can delete created team by FK fields", ::canDeleteTeamByTeamFK, true)
//            test("can delete created team by project predicate with PK matcher", ::canDeleteTeamByProjectPKPredicate, true)
//            test("observed team's project is attached", ::observedTeamHasProjectAttached)
//
//            // consistency checks
//            test("cannot create a project pointing to non-existent team", ::cannotCreateProjectWithBadTeam)
//            test("cannot create a team pointing to a bad project", ::cannotCreateTeamWithBadProject)
//            test("deleting a team clears project FK", ::teamDeleteClearsProjectFK)
//            test("deleting a project deletes the team pointing to it", ::projectDeleteCascadesToTeam)
//
//            // Team (belongsTo) predicate provides a `.PROJECT` matcher, so we only have two
//            // test case for each of create,update + observe,observeQuery.
//            test("can observe a team creation by team FK", ::canObserveTeamCreateByFK, true)
//            test("can observe a team creation by project predicate PK matcher", ::canObserveTeamCreateProjectPKPredicate)
//            test("can observe a team update by team FK", ::canObserveTeamUpdateByFK, true)
//            test("can observe a team update project predicate PK matcher", ::canObserveTeamUpdateByProjectPKPredicate)
//
//            test("can observeQuery a team create by team FK", ::canObserveQueryTeamCreateByFK, true)
//            test("can observeQuery a team create by project PK predicate", ::canObserveQueryTeamCreateByProjectPKPredicate)
//            test("can observeQuery a team update by team FK", ::canObserveQueryTeamUpdateByFK, true)
//            test("can observeQuery a team update by project PK predicate", ::canObserveQueryTeamUpdateByProjectPKPredicate)

            test("can observe project creation from another client", ::canObserveProjectCreateFromAnotherClient)

            // fails to create the mutation. not sure if this is expected right now.
            test("can observe team creation from another client", ::canObserveTeamCreateFromAnotherClient, true)

            Log.i("Tutorial", "at the bottom of the launch")
        }

        Log.i("Tutorial", "after scope (will log before coroutine actually starts)")

    }
}
